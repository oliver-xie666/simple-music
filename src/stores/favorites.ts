import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song } from '../types'

export const useFavoritesStore = defineStore('favorites', () => {
  // State
  const songs = ref<Song[]>([])

  // Getters
  const count = computed(() => songs.value.length)
  
  const isEmpty = computed(() => songs.value.length === 0)

  // Actions
  function isFavorite(song: Song): boolean {
    return songs.value.some(s => s.id === song.id && s.source === song.source)
  }

  function addFavorite(song: Song) {
    if (isFavorite(song)) {
      return
    }
    songs.value.unshift(song)
    saveToStorage()
  }

  function removeFavorite(song: Song) {
    const index = songs.value.findIndex(s => s.id === song.id && s.source === song.source)
    if (index !== -1) {
      songs.value.splice(index, 1)
      saveToStorage()
    }
  }

  function toggleFavorite(song: Song) {
    if (isFavorite(song)) {
      removeFavorite(song)
    } else {
      addFavorite(song)
    }
  }

  function clearFavorites() {
    songs.value = []
    saveToStorage()
  }

  // 导出收藏列表
  function exportFavorites(): string {
    const data = {
      songs: songs.value,
      timestamp: Date.now(),
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入收藏列表
  function importFavorites(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)
      if (data.songs && Array.isArray(data.songs)) {
        // 合并，避免重复
        data.songs.forEach((song: Song) => {
          if (!isFavorite(song)) {
            songs.value.push(song)
          }
        })
        saveToStorage()
        return true
      }
      return false
    } catch (error) {
      console.error('导入收藏列表失败:', error)
      return false
    }
  }

  // 保存到本地存储
  async function saveToStorage() {
    const { saveData } = await import('../api')
    await saveData('favorites', {
      songs: songs.value,
    })
  }

  // 从本地存储加载
  async function loadFromStorage() {
    try {
      const { loadData } = await import('../api')
      const data = await loadData('favorites')
      if (data && data.songs) {
        songs.value = data.songs
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error)
    }
  }

  return {
    // State
    songs,
    // Getters
    count,
    isEmpty,
    // Actions
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    exportFavorites,
    importFavorites,
    saveToStorage,
    loadFromStorage,
  }
})

