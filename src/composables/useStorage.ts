import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { useFavoritesStore } from '../stores/favorites'
import { useThemeStore } from '../stores/theme'
import { saveData, loadData } from '../api'

export function useStorage() {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()
  const favoritesStore = useFavoritesStore()
  const themeStore = useThemeStore()

  /**
   * 保存所有状态到本地存储
   */
  async function saveToStorage() {
    try {
      await saveData('simple-music-state', {
        playlist: playlistStore.songs,
        favorites: favoritesStore.songs,
        currentIndex: playlistStore.currentIndex,
        volume: playerStore.volume,
        playMode: playerStore.playMode,
        quality: playerStore.quality,
        isDark: themeStore.isDark
      })
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  }

  /**
   * 从本地存储加载所有状态
   */
  async function loadFromStorage() {
    try {
      const data = await loadData('simple-music-state')
      if (data) {
        playlistStore.songs = data.playlist || []
        favoritesStore.songs = data.favorites || []
        playlistStore.currentIndex = data.currentIndex ?? -1
        playerStore.setVolume(data.volume ?? 0.8)
        playerStore.setPlayMode(data.playMode || 'list-loop')
        playerStore.setQuality(data.quality || '320')
        themeStore.setTheme(data.isDark ?? false)
        
        if (playlistStore.currentIndex >= 0 && playlistStore.currentIndex < playlistStore.songs.length) {
          playerStore.setCurrentSong(playlistStore.songs[playlistStore.currentIndex])
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  return {
    saveToStorage,
    loadFromStorage,
  }
}

