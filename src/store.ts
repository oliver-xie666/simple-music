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

  function playAtIndex(index: number) {
    if (index >= 0 && index < playlist.value.length) {
      currentIndex.value = index
      currentSong.value = playlist.value[index]
      play()
      
      // 加载歌词
      if (currentSong.value.lrc) {
        loadLyrics(currentSong.value.lrc)
      } else {
        lyrics.value = []
      }
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

  // ========== 搜索 ==========
  async function search(keyword: string) {
    if (!keyword.trim()) {
      showNotification('请输入搜索关键字', 'error')
      return
    }
    searchQuery.value = keyword
    isSearching.value = true
    
    try {
      const signature = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const url = `/proxy?types=search&source=${searchSource.value}&name=${encodeURIComponent(keyword)}&count=100&pages=1&s=${signature}`
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        searchResults.value = data.map((item: any) => ({
          id: String(item.id ?? item.url_id ?? Math.random()),
          name: item.name ?? item.title ?? '未知歌曲',
          artist: item.artist ?? item.author ?? '未知艺术家',
          album: item.album ?? '未知专辑',
          cover: item.pic ?? '',
          url: item.url ?? '',
          lrc: item.lrc ?? '',
          duration: 0,
          source: item.source ?? searchSource.value
        }))
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

  // ========== 歌词 ==========
  async function loadLyrics(lrcUrl: string) {
    try {
      if (!lrcUrl) {
        lyrics.value = []
        return
      }
      
      const response = await fetch(lrcUrl)
      const text = await response.text()
      lyrics.value = parseLrc(text)
    } catch (error) {
      console.error('加载歌词失败:', error)
      lyrics.value = []
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
    currentSong, isPlaying, currentTime, duration, volume, playMode, quality, isLoading,
    playlist, currentIndex, searchQuery, searchResults, searchSource, isSearching,
    lyrics, currentLyricLine, isDark, currentGradient, notification,
    // 计算属性
    progress, formattedCurrentTime, formattedDuration,
    // 方法
    play, pause, togglePlay, playAtIndex, playNext, playPrevious,
    addToPlaylist, removeFromPlaylist, clearPlaylist,
    search, loadLyrics, updateLyricIndex,
    toggleTheme, saveToStorage, loadFromStorage,
    addAllToPlaylist, showNotification,
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
