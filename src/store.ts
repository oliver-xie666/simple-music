// 统一状态管理 
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, PlayMode, QualityType, LyricLine, MusicSource } from './types'
import { getSongUrl, getLyric, getPicUrl } from './api'

export const useAppStore = defineStore('app', () => {
  // ========== 播放器状态 ==========
  const currentSong = ref<Song | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const playMode = ref<PlayMode>('list-loop')
  const quality = ref<QualityType>('320')
  const isLoading = ref(false)
  const pendingSeekTime = ref<number | null>(null)

  // ========== 播放列表 & 收藏 ==========
  const playlist = ref<Song[]>([])
  const currentIndex = ref(-1)
  const favorites = ref<Song[]>([])

  // ========== 搜索 ==========
  const searchQuery = ref('')
  const searchResults = ref<Song[]>([])
  const searchSource = ref<MusicSource>('netease')
  const isSearching = ref(false)
  const searchPage = ref(1)
  const searchLimit = ref(20)
  const searchTotal = ref(0)
  const selectedSearchResults = ref<Set<number>>(new Set())

  // ========== 歌词 ==========
  const lyrics = ref<LyricLine[]>([])
  const currentLyricLine = ref(-1)
  function resetLyrics() {
    lyrics.value = []
    currentLyricLine.value = -1
  }

  // ========== 主题 ==========
  const isDark = ref(false)
  const currentGradient = ref('linear-gradient(140deg, #e0f5e9 0%, #c6f0e0 35%, #a3e4d7 100%)')

  // ========== 通知系统 ==========
  const notification = ref({ message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info', show: false })
  
  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    notification.value = { message, type, show: true }
    setTimeout(() => {
      notification.value.show = false
    }, 3000)
  }

  // ========== 计算属性 ==========
  const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)
  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  // ========== 播放控制 ==========
  function play() { isPlaying.value = true }
  function pause() { isPlaying.value = false }
  function togglePlay() { isPlaying.value = !isPlaying.value }

  async function prepareSongForPlayback(song: Song): Promise<Song> {
    const needsRefresh = !song.url || (song.resolvedQuality && song.resolvedQuality !== quality.value)

    if (!needsRefresh && song.url) {
      return song
    }

    try {
      const response = await getSongUrl(song.id, song.source, mapQualityToApiValue(quality.value))
      const playbackUrl = response?.data?.url

      if (!playbackUrl) {
        throw new Error('无法获取播放地址')
      }

      return {
        ...song,
        url: playbackUrl,
        resolvedQuality: quality.value
      }
    } catch (error) {
      console.error('获取播放地址失败:', error)
      throw new Error('无法获取播放地址')
    }
  }

  async function playAtIndex(index: number) {
    // 防止在切歌过程中被重复触发（例如双击）
    if (isLoading.value) return false
    if (index < 0 || index >= playlist.value.length) return false

    const targetSong = playlist.value[index]
    isLoading.value = true

    try {
      const playableSong = await prepareSongForPlayback(targetSong)
      const hydratedSong = await ensureSongArtwork(playableSong)
      playlist.value[index] = hydratedSong
      currentIndex.value = index
      currentSong.value = hydratedSong
      play()

      loadLyrics(hydratedSong)

      return true
    } catch (error: any) {
      console.error('播放失败:', error)
      pause()
      showNotification(error?.message || '播放失败，请稍后重试', 'error')
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function playNext() {
    if (playlist.value.length === 0) return

    if (playMode.value === 'single-loop') {
      currentTime.value = 0
      play()
      return
    }
    if (playMode.value === 'shuffle') {
      const randomIndex = Math.floor(Math.random() * playlist.value.length)
      await playAtIndex(randomIndex)
      return
    }
    if (currentIndex.value < playlist.value.length - 1) {
      await playAtIndex(currentIndex.value + 1)
    } else {
      await playAtIndex(0)
    }
  }

  async function playPrevious() {
    if (playlist.value.length === 0) return

    if (currentIndex.value > 0) {
      await playAtIndex(currentIndex.value - 1)
    } else {
      await playAtIndex(playlist.value.length - 1)
    }
  }

  // 切换音质后，重新加载当前歌曲，同时尽量保留播放进度和播放/暂停状态
  async function reloadCurrentSongWithNewQuality(): Promise<boolean> {
    if (!currentSong.value || currentIndex.value < 0 || currentIndex.value >= playlist.value.length) {
      return false
    }

    const wasPlaying = isPlaying.value
    const targetTime = currentTime.value || 0

    try {
      const targetIndex = currentIndex.value
      const playableSong = await prepareSongForPlayback(playlist.value[targetIndex])
      const hydratedSong = await ensureSongArtwork(playableSong)
      playlist.value[targetIndex] = hydratedSong
      currentSong.value = hydratedSong

      // 重新加载歌词，确保与当前歌曲同步
      await loadLyrics(hydratedSong)

      // 记录需要恢复的播放进度，待音频元数据加载完成后在 App 中统一处理
      pendingSeekTime.value = targetTime

      // 恢复之前的播放/暂停状态
      if (wasPlaying) {
        play()
      } else {
        pause()
      }

      return true
    } catch (error) {
      console.error('切换音质后重新加载当前歌曲失败:', error)
      return false
    }
  }

  // ========== 播放列表管理 ==========
  function addToPlaylist(song: Song) {
    if (!playlist.value.find(s => s.id === song.id && s.source === song.source)) {
      playlist.value.push(song)
      saveToStorage()
    }
  }

  function removeFromPlaylist(index: number) {
    playlist.value.splice(index, 1)
    if (currentIndex.value === index) {
      if (playlist.value.length === 0) {
        currentIndex.value = -1
        currentSong.value = null
      } else if (currentIndex.value >= playlist.value.length) {
        currentIndex.value = playlist.value.length - 1
      }
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }
    saveToStorage()
  }

  function clearPlaylist() {
    playlist.value = []
    currentIndex.value = -1
    currentSong.value = null
    pause()
    resetLyrics()
    saveToStorage()
  }

  // 收藏列表管理
  const isSameSong = (a: Song, b: Song) => a.id === b.id && a.source === b.source

  function isFavorite(song: Song) {
    return favorites.value.some(s => isSameSong(s, song))
  }

  function addToFavorites(song: Song) {
    if (!isFavorite(song)) {
      favorites.value.push(song)
      saveToStorage()
    }
  }

  function removeFromFavorites(song: Song) {
    favorites.value = favorites.value.filter(s => !isSameSong(s, song))
    saveToStorage()
  }

  function toggleFavorite(song: Song) {
    if (isFavorite(song)) {
      removeFromFavorites(song)
      showNotification('已从收藏列表移除', 'info')
    } else {
      addToFavorites(song)
      showNotification('已添加到收藏列表', 'success')
    }
  }

  function clearFavorites() {
    favorites.value = []
    saveToStorage()
  }

  // ========== 搜索 ==========
  async function search(keyword: string, page: number = 1, append: boolean = false) {
    if (!keyword.trim()) {
      showNotification('请输入搜索关键字', 'error')
      return
    }
    if (!append) {
      searchQuery.value = keyword
      searchPage.value = page
      selectedSearchResults.value.clear()
    }
    isSearching.value = true
    
    try {
      const signature = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const url = `/proxy?types=search&source=${searchSource.value}&name=${encodeURIComponent(keyword)}&count=${searchLimit.value}&pages=${page}&s=${signature}`
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const newResults = data.map((item: any) => {
          const lyricId = getFirstNonEmptyString(item.lyric_id, item.lyricId, item.id)
          const picId = getFirstNonEmptyString(item.pic_id, item.picId, item.pic_str)
          const urlId = getFirstNonEmptyString(item.url_id, item.urlId)
          const coverUrl = typeof item.pic === 'string' ? item.pic : ''
          const lrcValue = typeof item.lrc === 'string' ? item.lrc : ''

          return {
            id: String(item.id ?? urlId ?? Math.random()),
            name: item.name ?? item.title ?? '未知歌曲',
            artist: normalizeArtistField(item.artist ?? item.author),
            album: normalizeAlbumField(item.album),
            cover: coverUrl,
            picId: picId || undefined,
            url: item.url ?? '',
            urlId: urlId || undefined,
            lrc: lrcValue,
            lyricId: lyricId || undefined,
            duration: Number(item.time ?? item.duration ?? 0) || 0,
            source: item.source ?? searchSource.value
          } as Song
        })
        
        if (append) {
          searchResults.value = [...searchResults.value, ...newResults]
        } else {
          searchResults.value = newResults
        }
        searchTotal.value = searchResults.value.length
      } else {
        showNotification('搜索结果格式错误', 'error')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showNotification('搜索失败，请稍后重试', 'error')
    } finally {
      isSearching.value = false
    }
  }

  function loadMoreSearchResults() {
    if (isSearching.value) return
    searchPage.value++
    search(searchQuery.value, searchPage.value, true)
  }

  function goToPage(page: number) {
    if (isSearching.value) return
    if (page < 1) return
    search(searchQuery.value, page, false)
  }

  function setSearchLimit(limit: number) {
    searchLimit.value = limit
    // 重新搜索当前页
    if (searchQuery.value.trim()) {
      search(searchQuery.value, searchPage.value, false)
    }
  }

  function toggleSearchResultSelection(index: number) {
    if (selectedSearchResults.value.has(index)) {
      selectedSearchResults.value.delete(index)
    } else {
      selectedSearchResults.value.add(index)
    }
  }

  function clearSearchResultSelection() {
    selectedSearchResults.value.clear()
  }

  async function playAllSearchResults() {
    if (searchResults.value.length === 0) return
    const startIndex = playlist.value.length
    searchResults.value.forEach(song => addToPlaylist(song))
    if (playlist.value.length > startIndex) {
      await playAtIndex(startIndex)
    }
    showNotification(`已添加 ${searchResults.value.length} 首歌曲到播放列表`, 'success')
  }

  function importSelectedSearchResults(target: 'playlist' | 'favorites' = 'playlist') {
    if (selectedSearchResults.value.size === 0) {
      showNotification('请先选择要导入的歌曲', 'warning')
      return
    }
    
    const indices = Array.from(selectedSearchResults.value).filter(idx => idx >= 0 && idx < searchResults.value.length)
    const songsToAdd = indices.map(idx => searchResults.value[idx]).filter(Boolean)
    
    if (songsToAdd.length === 0) {
      showNotification('未找到可导入的歌曲', 'warning')
      return
    }
    
    if (target === 'playlist') {
      songsToAdd.forEach(song => addToPlaylist(song))
      showNotification(`已导入 ${songsToAdd.length} 首歌曲到播放列表`, 'success')
    } else {
      songsToAdd.forEach(song => addToFavorites(song))
      showNotification(`已导入 ${songsToAdd.length} 首歌曲到收藏列表`, 'success')
    }
    
    clearSearchResultSelection()
  }

  // ========== 歌词 ==========
  let lyricRequestId = 0

  async function loadLyrics(song?: Song | null) {
    const requestId = ++lyricRequestId

    if (!song) {
      resetLyrics()
      return
    }

    try {
      const lyricText = await resolveLyricText(song)
      if (requestId !== lyricRequestId) return

      if (!lyricText.trim()) {
        resetLyrics()
        return
      }

      lyrics.value = parseLrc(lyricText)
      currentLyricLine.value = -1
    } catch (error) {
      if (requestId !== lyricRequestId) return
      console.error('加载歌词失败:', error)
      resetLyrics()
    }
  }

  function updateLyricIndex() {
    if (lyrics.value.length === 0) return
    
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (currentTime.value >= lyrics.value[i].time) {
        currentLyricLine.value = i
        return
      }
    }
    currentLyricLine.value = -1
  }

  // ========== 主题 ==========
  function toggleTheme() {
    isDark.value = !isDark.value
    if (isDark.value) {
      currentGradient.value = 'linear-gradient(135deg, #0b1d1b 0%, #0f2f2c 45%, #123c36 100%)'
    } else {
      currentGradient.value = 'linear-gradient(140deg, #e0f5e9 0%, #c6f0e0 35%, #a3e4d7 100%)'
    }
    saveToStorage()
  }

  // ========== 批量操作 ==========
  function addAllToPlaylist(songs: Song[]) {
    songs.forEach(song => addToPlaylist(song))
  }

  // ========== 本地存储 ==========
  function saveToStorage() {
    try {
      localStorage.setItem('simple-music-state', JSON.stringify({
        playlist: playlist.value,
        favorites: favorites.value,
        currentIndex: currentIndex.value,
        volume: volume.value,
        playMode: playMode.value,
        quality: quality.value,
        isDark: isDark.value
      }))
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('simple-music-state')
      if (saved) {
        const data = JSON.parse(saved)
        playlist.value = data.playlist || []
        favorites.value = data.favorites || []
        currentIndex.value = data.currentIndex ?? -1
        volume.value = data.volume ?? 0.8
        playMode.value = data.playMode || 'list-loop'
        quality.value = data.quality || '320'
        isDark.value = data.isDark ?? false
        
        if (isDark.value) {
          currentGradient.value = 'linear-gradient(135deg, #0b1d1b 0%, #0f2f2c 45%, #123c36 100%)'
        }
        
        if (currentIndex.value >= 0 && currentIndex.value < playlist.value.length) {
          currentSong.value = playlist.value[currentIndex.value]
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  return {
    // 状态
    currentSong, isPlaying, currentTime, duration, volume, playMode, quality, isLoading, pendingSeekTime,
    playlist, currentIndex, searchQuery, searchResults, searchSource, isSearching,
    searchPage, searchLimit, searchTotal, selectedSearchResults,
    lyrics, currentLyricLine, isDark, currentGradient, notification,
    // 计算属性
    progress, formattedCurrentTime, formattedDuration,
    // 方法
    play, pause, togglePlay, playAtIndex, playNext, playPrevious,
    addToPlaylist, removeFromPlaylist, clearPlaylist,
    search, loadMoreSearchResults, goToPage, setSearchLimit, loadLyrics, updateLyricIndex,
    toggleSearchResultSelection, clearSearchResultSelection,
    playAllSearchResults, importSelectedSearchResults,
    toggleTheme, saveToStorage, loadFromStorage,
    addAllToPlaylist, showNotification,
    // 为当前歌曲补全封面（如果缺失）
    hydrateCurrentSongArtwork: async () => {
      if (!currentSong.value) return
      const hydrated = await ensureSongArtwork(currentSong.value)
      currentSong.value = hydrated
      if (currentIndex.value >= 0 && currentIndex.value < playlist.value.length) {
        playlist.value[currentIndex.value] = hydrated
      }
    },
    setCurrentTime: (time: number) => currentTime.value = time,
    setDuration: (d: number) => duration.value = d,
    setVolume: (v: number) => volume.value = v,
    setPlayMode: (mode: PlayMode) => playMode.value = mode,
    setQuality: (q: QualityType) => quality.value = q,
    setLoading: (loading: boolean) => isLoading.value = loading,
    reloadCurrentSongWithNewQuality,
    setPendingSeekTime: (time: number | null) => pendingSeekTime.value = time
  }
})

// 工具函数
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return []
  const lines = lrcText.split('\n')
  const lyrics: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeRegex))
    if (matches.length === 0) continue
    const text = line.replace(timeRegex, '').trim()
    if (!text) continue

    for (const match of matches) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + milliseconds / 1000
      lyrics.push({ time, text })
    }
  }

  return lyrics.sort((a, b) => a.time - b.time)
}

async function resolveLyricText(song: Song): Promise<string> {
  if (song.lrc) {
    if (song.lrc.startsWith('http')) {
      const response = await fetch(song.lrc)
      return await response.text()
    }
    if (isInlineLyricPayload(song.lrc)) {
      return song.lrc
    }
  }

  const lyricId = song.lyricId || song.id
  if (!lyricId) return ''

  const response = await getLyric(lyricId, song.source)
  const data = response?.data

  if (typeof data === 'string') {
    return data
  }

  if (data && typeof data.lyric === 'string') {
    return data.lyric
  }

  if (data && typeof data.lrc === 'string') {
    return data.lrc
  }

  if (data && typeof data.lrc === 'object' && typeof data.lrc?.lyric === 'string') {
    return data.lrc.lyric
  }

  return ''
}

function isInlineLyricPayload(content: string) {
  return /\[\d{2}:\d{2}/.test(content)
}

async function ensureSongArtwork(song: Song): Promise<Song> {
  if (song.cover && song.cover.trim().length > 0) {
    return song
  }
  if (!song.picId) return song

  try {
    const coverUrl = await getPicUrl(song.picId, song.source)
    if (!coverUrl) {
      return song
    }
    return { ...song, cover: coverUrl }
  } catch (error) {
    console.error('封面获取失败:', error)
    return song
  }
}

export function normalizeArtistField(value: any): string {
  if (value === undefined || value === null) return '未知艺术家'

  if (Array.isArray(value)) {
    const names = value
      .map(entry => {
        if (!entry) return ''
        if (typeof entry === 'string') return entry
        if (typeof entry === 'object') {
          return getFirstNonEmptyString(entry.name, entry.title, entry.artist)
        }
        return String(entry)
      })
      .filter(Boolean)

    return names.length ? names.join(' / ') : '未知艺术家'
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.artist)) return normalizeArtistField(value.artist)
    if (Array.isArray(value.ar)) return normalizeArtistField(value.ar)
    if (Array.isArray((value as any).data)) return normalizeArtistField((value as any).data)

    return getFirstNonEmptyString(value.name, value.title, value.artist) || '未知艺术家'
  }

  return String(value)
}

function normalizeAlbumField(value: any): string {
  if (value === undefined || value === null) return '未知专辑'

  if (typeof value === 'object') {
    return getFirstNonEmptyString(value.name, value.title, value.album) || '未知专辑'
  }

  return String(value)
}

function getFirstNonEmptyString(...values: any[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const str = String(value).trim()
    if (str) return str
  }
  return ''
}

function mapQualityToApiValue(targetQuality: QualityType) {
  return targetQuality === 'flac' ? '999' : targetQuality
}
