import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LyricLine, Song } from '../types'
import { parseLrc, resolveLyricText } from '../utils/lyric-utils'

export const useLyricsStore = defineStore('lyrics', () => {
  // State
  const lyrics = ref<LyricLine[]>([])
  const currentLine = ref(-1)
  const isScrollLocked = ref(false)

  // Getters
  const currentLyric = computed(() => {
    if (currentLine.value >= 0 && currentLine.value < lyrics.value.length) {
      return lyrics.value[currentLine.value]
    }
    return null
  })

  const isEmpty = computed(() => lyrics.value.length === 0)

  // Actions
  async function loadLyrics(song: Song | null) {
    if (!song) {
      clearLyrics()
      return
    }

    try {
      const lyricText = await resolveLyricText(song)
      if (!lyricText.trim()) {
        clearLyrics()
        return
      }
      lyrics.value = parseLrc(lyricText)
      currentLine.value = -1
    } catch (error) {
      console.error('加载歌词失败:', error)
      clearLyrics()
    }
  }

  function updateCurrentLine(currentTime: number) {
    if (lyrics.value.length === 0) {
      currentLine.value = -1
      return
    }
    
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics.value[i].time) {
        currentLine.value = i
        return
      }
    }
    currentLine.value = -1
  }

  function clearLyrics() {
    lyrics.value = []
    currentLine.value = -1
  }

  function setCurrentLine(index: number) {
    if (lyrics.value.length === 0) {
      currentLine.value = -1
      return
    }
    if (typeof index !== 'number' || Number.isNaN(index)) {
      currentLine.value = -1
      return
    }
    const clamped = Math.max(-1, Math.min(index, lyrics.value.length - 1))
    currentLine.value = clamped
  }

  function toggleScrollLock() {
    isScrollLocked.value = !isScrollLocked.value
  }

  function setScrollLock(locked: boolean) {
    isScrollLocked.value = locked
  }

  return {
    // State
    lyrics,
    currentLine,
    isScrollLocked,
    // Getters
    currentLyric,
    isEmpty,
    // Actions
    loadLyrics,
    updateCurrentLine,
    clearLyrics,
    setCurrentLine,
    toggleScrollLock,
    setScrollLock,
  }
})


