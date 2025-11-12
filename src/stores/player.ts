import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, PlayMode, QualityType } from '../types'

export const usePlayerStore = defineStore('player', () => {
  // State
  const currentSong = ref<Song | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const playMode = ref<PlayMode>('list-loop')
  const quality = ref<QualityType>('320')
  const isLoading = ref(false)

  // Getters
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => {
    return formatTime(currentTime.value)
  })

  const formattedDuration = computed(() => {
    return formatTime(duration.value)
  })

  // Actions
  function play() {
    isPlaying.value = true
  }

  function pause() {
    isPlaying.value = false
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function setCurrentSong(song: Song | null) {
    currentSong.value = song
    currentTime.value = 0
  }

  function setCurrentTime(time: number) {
    currentTime.value = time
  }

  function setDuration(time: number) {
    duration.value = time
  }

  function setVolume(vol: number) {
    volume.value = Math.max(0, Math.min(1, vol))
  }

  function setPlayMode(mode: PlayMode) {
    playMode.value = mode
  }

  function setQuality(q: QualityType) {
    quality.value = q
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  // 保存到本地存储
  async function saveToStorage() {
    const data = {
      volume: volume.value,
      playMode: playMode.value,
      quality: quality.value,
    }
    await window.electronAPI.saveData('player-settings', data)
  }

  // 从本地存储加载
  async function loadFromStorage() {
    try {
      const data = await window.electronAPI.loadData('player-settings')
      if (data) {
        volume.value = data.volume ?? 0.8
        playMode.value = data.playMode ?? 'list-loop'
        quality.value = data.quality ?? '320'
      }
    } catch (error) {
      console.error('加载播放器设置失败:', error)
    }
  }

  return {
    // State
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    quality,
    isLoading,
    // Getters
    progress,
    formattedCurrentTime,
    formattedDuration,
    // Actions
    play,
    pause,
    togglePlay,
    setCurrentSong,
    setCurrentTime,
    setDuration,
    setVolume,
    setPlayMode,
    setQuality,
    setLoading,
    saveToStorage,
    loadFromStorage,
  }
})

// 工具函数：格式化时间
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '00:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

