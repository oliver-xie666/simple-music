// 统一状态管理 - 完全按照 Solara 的逻辑
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, PlayMode, QualityType, LyricLine, MusicSource } from './types'

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

  // ========== 播放列表 ==========
  const playlist = ref<Song[]>([])
  const currentIndex = ref(-1)

  // ========== 收藏列表 ==========
  const favorites = ref<Song[]>([])

  // ========== 搜索 ==========
  const searchQuery = ref('')
  const searchResults = ref<Song[]>([])
  const searchSource = ref<MusicSource>('netease')
  const isSearching = ref(false)

  // ========== 歌词 ==========
  const lyrics = ref<LyricLine[]>([])
  const currentLyricLine = ref(-1)

  // ========== 主题 ==========
  const isDark = ref(false)
  const currentGradient = ref('linear-gradient(140deg, #e0f5e9 0%, #c6f0e0 35%, #a3e4d7 100%)')

  // ========== 计算属性 ==========
  const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)
  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  // ========== 播放控制 ==========
  function play() { isPlaying.value = true }
  function pause() { isPlaying.value = false }
  function togglePlay() { isPlaying.value = !isPlaying.value }

  function playAtIndex(index: number) {
    if (index >= 0 && index < playlist.value.length) {
      currentIndex.value = index
      currentSong.value = playlist.value[index]
      play()
    }
  }

  function playNext() {
    if (playMode.value === 'single-loop') {
      currentTime.value = 0
      play()
      return
    }
    if (playMode.value === 'shuffle') {
      const randomIndex = Math.floor(Math.random() * playlist.value.length)
      playAtIndex(randomIndex)
      return
    }
    if (currentIndex.value < playlist.value.length - 1) {
      playAtIndex(currentIndex.value + 1)
    } else {
      playAtIndex(0)
    }
  }

  function playPrevious() {
    if (currentIndex.value > 0) {
      playAtIndex(currentIndex.value - 1)
    } else {
      playAtIndex(playlist.value.length - 1)
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
    saveToStorage()
  }

  // ========== 收藏管理 ==========
  function isFavorite(song: Song) {
    return favorites.value.some(s => s.id === song.id && s.source === song.source)
  }

  function toggleFavorite(song: Song) {
    if (isFavorite(song)) {
      favorites.value = favorites.value.filter(s => !(s.id === song.id && s.source === song.source))
    } else {
      favorites.value.unshift(song)
    }
    saveToStorage()
  }

  // ========== 搜索 ==========
  async function search(keyword: string) {
    if (!keyword.trim()) return
    searchQuery.value = keyword
    isSearching.value = true
    
    try {
      console.log('开始搜索:', keyword, searchSource.value)
      const response = await window.electronAPI.searchMusic({
        keyword,
        source: searchSource.value,
        page: 1
      })
      
      console.log('搜索响应:', response)
      
      if (response && response.success && response.data) {
        // Solara API 返回的是数组格式
        const songs = Array.isArray(response.data) ? response.data : []
        searchResults.value = songs.map((item: any) => ({
          id: String(item.id),
          name: item.name || '未知歌曲',
          artist: item.artist || '未知艺术家',
          album: item.album || '未知专辑',
          cover: '', // 稍后通过 getPicUrl 获取
          pic_id: item.pic_id,
          url_id: item.url_id || item.id,
          lyric_id: item.lyric_id || item.id,
          duration: 0,
          source: item.source || searchSource.value
        }))
        
        console.log('解析后的歌曲:', searchResults.value)
        
        // 获取封面
        for (const song of searchResults.value) {
          if (song.pic_id) {
            const picResponse = await window.electronAPI.getPicUrl({ picId: song.pic_id, source: song.source })
            if (picResponse && picResponse.success) {
              song.cover = picResponse.url
            }
          }
        }
      }
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      isSearching.value = false
    }
  }

  // ========== 歌词 ==========
  async function loadLyrics(songId: string, source: string) {
    try {
      const response = await window.electronAPI.fetchLyrics({ id: songId, source })
      if (response && response.success && response.data) {
        const lyricText = response.data.lyric || response.data.lrc?.lyric || ''
        lyrics.value = parseLrc(lyricText)
      }
    } catch (error) {
      lyrics.value = []
    }
  }

  function updateCurrentLyricLine(time: number) {
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (time >= lyrics.value[i].time) {
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
      document.body.classList.add('dark-mode')
      currentGradient.value = 'linear-gradient(135deg, #0b1d1b 0%, #0f2f2c 45%, #123c36 100%)'
    } else {
      document.body.classList.remove('dark-mode')
      currentGradient.value = 'linear-gradient(140deg, #e0f5e9 0%, #c6f0e0 35%, #a3e4d7 100%)'
    }
    saveToStorage()
  }

  async function extractColors(coverUrl: string) {
    try {
      const response = await window.electronAPI.extractPalette(coverUrl)
      if (response && response.success && response.data) {
        const palette = response.data
        currentGradient.value = isDark.value ? palette.gradients.dark.gradient : palette.gradients.light.gradient
      }
    } catch (error) {
      console.error('提取颜色失败:', error)
    }
  }

  // ========== 本地存储 ==========
  async function saveToStorage() {
    await window.electronAPI.saveData('app-state', {
      playlist: playlist.value,
      currentIndex: currentIndex.value,
      favorites: favorites.value,
      volume: volume.value,
      playMode: playMode.value,
      quality: quality.value,
      isDark: isDark.value
    })
  }

  async function loadFromStorage() {
    try {
      const response = await window.electronAPI.loadData('app-state')
      if (response && response.success && response.data) {
        const data = response.data
        playlist.value = data.playlist || []
        currentIndex.value = data.currentIndex ?? -1
        favorites.value = data.favorites || []
        volume.value = data.volume ?? 0.8
        playMode.value = data.playMode || 'list-loop'
        quality.value = data.quality || '320'
        isDark.value = data.isDark ?? false
        
        if (isDark.value) {
          document.body.classList.add('dark-mode')
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
    currentSong, isPlaying, currentTime, duration, volume, playMode, quality, isLoading,
    playlist, currentIndex, favorites, searchQuery, searchResults, searchSource, isSearching,
    lyrics, currentLyricLine, isDark, currentGradient,
    // 计算属性
    progress, formattedCurrentTime, formattedDuration,
    // 方法
    play, pause, togglePlay, playAtIndex, playNext, playPrevious,
    addToPlaylist, removeFromPlaylist, clearPlaylist,
    isFavorite, toggleFavorite, search, loadLyrics, updateCurrentLyricLine,
    toggleTheme, extractColors, saveToStorage, loadFromStorage,
    setCurrentTime: (time: number) => currentTime.value = time,
    setDuration: (d: number) => duration.value = d,
    setVolume: (v: number) => volume.value = v,
    setPlayMode: (mode: PlayMode) => playMode.value = mode,
    setQuality: (q: QualityType) => quality.value = q,
    setLoading: (loading: boolean) => isLoading.value = loading
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
