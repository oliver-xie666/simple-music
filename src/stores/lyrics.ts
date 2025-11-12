import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LyricLine } from '../types'

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
  async function loadLyrics(songId: string, source: string) {
    try {
      const response = await window.electronAPI.fetchLyrics({ id: songId, source })
      
      if (response && response.data) {
        const lyricText = response.data.lyric || response.data.lrc?.lyric || ''
        lyrics.value = parseLrc(lyricText)
      } else {
        lyrics.value = []
      }
    } catch (error) {
      console.error('加载歌词失败:', error)
      lyrics.value = []
    }
  }

  function updateCurrentLine(currentTime: number) {
    if (lyrics.value.length === 0) {
      currentLine.value = -1
      return
    }

    // 找到当前时间对应的歌词行
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
    toggleScrollLock,
    setScrollLock,
  }
})

// 解析 LRC 格式歌词
function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return []

  const lines = lrcText.split('\n')
  const lyrics: LyricLine[] = []

  // LRC 时间标签正则：[mm:ss.xx] 或 [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeRegex))
    if (matches.length === 0) continue

    // 提取歌词文本（去掉所有时间标签）
    const text = line.replace(timeRegex, '').trim()
    if (!text) continue

    // 一行可能有多个时间标签
    for (const match of matches) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3].padEnd(3, '0'))
      
      const time = minutes * 60 + seconds + milliseconds / 1000

      lyrics.push({ time, text })
    }
  }

  // 按时间排序
  lyrics.sort((a, b) => a.time - b.time)

  return lyrics
}

