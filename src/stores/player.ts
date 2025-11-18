import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, PlayMode, QualityType } from '../types'
import { formatTime } from '../utils/song-utils'

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
  const pendingSeekTime = ref<number | null>(null)

  // Getters
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

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

  function setPendingSeekTime(time: number | null) {
    pendingSeekTime.value = time
  }

  // 保存到本地存储
  async function saveToStorage() {
    const { saveData } = await import('../api')
    await saveData('player-settings', {
      volume: volume.value,
      playMode: playMode.value,
      quality: quality.value,
    })
  }

  // 从本地存储加载
  async function loadFromStorage() {
    try {
      const { loadData } = await import('../api')
      const data = await loadData('player-settings')
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
    pendingSeekTime,
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
    setPendingSeekTime,
    saveToStorage,
    loadFromStorage,
  }
})


