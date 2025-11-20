import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song } from '../types'
import { usePlayerStore } from './player'
import { useLyricsStore } from './lyrics'

export const usePlaylistStore = defineStore('playlist', () => {
  const playerStore = usePlayerStore()
  const lyricsStore = useLyricsStore()

  // State
  const songs = ref<Song[]>([])
  const currentIndex = ref(-1)

  // Getters
  const currentSong = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < songs.value.length) {
      return songs.value[currentIndex.value]
    }
    return null
  })

  const hasNext = computed(() => {
    return currentIndex.value < songs.value.length - 1
  })

  const hasPrevious = computed(() => {
    return currentIndex.value > 0
  })

  const isEmpty = computed(() => {
    return songs.value.length === 0
  })

  // Actions
  function addSong(song: Song) {
    // 检查是否已存在
    const exists = songs.value.find(s => s.id === song.id && s.source === song.source)
    if (exists) {
      return
    }
    songs.value.push(song)
    saveToStorage()
  }

  function addSongs(newSongs: Song[]) {
    newSongs.forEach(song => addSong(song))
  }

  function removeSong(index: number) {
    if (index < 0 || index >= songs.value.length) return

    songs.value.splice(index, 1)
    
    // 调整当前索引
    if (currentIndex.value === index) {
      // 当前歌曲被删除，播放下一首或清空
      if (songs.value.length === 0) {
        currentIndex.value = -1
        playerStore.setCurrentSong(null)
      } else if (currentIndex.value >= songs.value.length) {
        currentIndex.value = songs.value.length - 1
      }
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }
    
    saveToStorage()
  }

  function clearPlaylist() {
    songs.value = []
    currentIndex.value = -1
    playerStore.setCurrentSong(null)
    playerStore.pause()
    lyricsStore.clearLyrics()
    saveToStorage()
  }

  function playAtIndex(index: number) {
    if (index < 0 || index >= songs.value.length) return

    currentIndex.value = index
    const song = songs.value[index]
    playerStore.setCurrentSong(song)
    playerStore.play()
  }

  function playNext() {
    if (playerStore.playMode === 'single-loop') {
      // 单曲循环，重新播放当前歌曲
      playerStore.setCurrentTime(0)
      playerStore.play()
      return
    }

    if (playerStore.playMode === 'shuffle') {
      // 随机播放
      const randomIndex = Math.floor(Math.random() * songs.value.length)
      playAtIndex(randomIndex)
      return
    }

    // 列表循环
    if (hasNext.value) {
      playAtIndex(currentIndex.value + 1)
    } else {
      // 回到第一首
      playAtIndex(0)
    }
  }

  function playPrevious() {
    if (hasPrevious.value) {
      playAtIndex(currentIndex.value - 1)
    } else {
      // 回到最后一首
      playAtIndex(songs.value.length - 1)
    }
  }

  // 移动歌曲位置
  function moveSong(from: number, to: number) {
    if (from < 0 || from >= songs.value.length || to < 0 || to >= songs.value.length) {
      return
    }

    const [song] = songs.value.splice(from, 1)
    songs.value.splice(to, 0, song)

    // 更新当前索引
    if (currentIndex.value === from) {
      currentIndex.value = to
    } else if (from < currentIndex.value && to >= currentIndex.value) {
      currentIndex.value--
    } else if (from > currentIndex.value && to <= currentIndex.value) {
      currentIndex.value++
    }

    saveToStorage()
  }

  // 导出播放列表
  function exportPlaylist(): string {
    const data = {
      songs: songs.value,
      timestamp: Date.now(),
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入播放列表
  function importPlaylist(jsonString: string) {
    try {
      const data = JSON.parse(jsonString)
      if (data.songs && Array.isArray(data.songs)) {
        songs.value = data.songs
        saveToStorage()
        return true
      }
      return false
    } catch (error) {
      console.error('导入播放列表失败:', error)
      return false
    }
  }

  // 保存到本地存储
  async function saveToStorage() {
    const { saveData } = await import('../api')
    await saveData('playlist', {
      songs: songs.value,
      currentIndex: currentIndex.value,
    })
  }

  // 从本地存储加载
  async function loadFromStorage() {
    try {
      const { loadData } = await import('../api')
      const data = await loadData('playlist')
      if (data) {
        songs.value = data.songs || []
        currentIndex.value = data.currentIndex ?? -1
        
        // 恢复当前歌曲
        if (currentIndex.value >= 0 && currentIndex.value < songs.value.length) {
          playerStore.setCurrentSong(songs.value[currentIndex.value])
        }
      }
    } catch (error) {
      console.error('加载播放列表失败:', error)
    }
  }

  return {
    // State
    songs,
    currentIndex,
    // Getters
    currentSong,
    hasNext,
    hasPrevious,
    isEmpty,
    // Actions
    addSong,
    addSongs,
    removeSong,
    clearPlaylist,
    playAtIndex,
    playNext,
    playPrevious,
    moveSong,
    exportPlaylist,
    importPlaylist,
    saveToStorage,
    loadFromStorage,
  }
})

