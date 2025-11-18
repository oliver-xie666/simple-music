import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { useFavoritesStore } from '../stores/favorites'
import { useThemeStore } from '../stores/theme'
import { useLyricsStore } from '../stores/lyrics'
import { saveData, loadData } from '../api'

export function useStorage() {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()
  const favoritesStore = useFavoritesStore()
  const themeStore = useThemeStore()
  const lyricsStore = useLyricsStore()
  let playbackSnapshotTimer: ReturnType<typeof setTimeout> | null = null

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
        isDark: themeStore.isDark,
        lastPlayback: {
          currentTime: playerStore.currentTime,
          duration: playerStore.duration,
          isPlaying: playerStore.isPlaying,
          lyricLine: lyricsStore.currentLine,
          songId: playerStore.currentSong?.id ?? null,
          songSource: playerStore.currentSong?.source ?? null,
          timestamp: Date.now()
        }
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
        
        const playback = data.lastPlayback || {}
        const savedTime = typeof playback.currentTime === 'number' && playback.currentTime >= 0
          ? playback.currentTime
          : null
        const savedLyricLine = typeof playback.lyricLine === 'number'
          ? playback.lyricLine
          : null
        const shouldResumePlaying = playback.isPlaying === true
        const savedDuration = typeof playback.duration === 'number' && playback.duration > 0
          ? playback.duration
          : null

        if (typeof savedTime === 'number') {
          playerStore.setCurrentTime(savedTime)
          playerStore.setPendingSeekTime(savedTime)
        }
        if (savedDuration !== null) {
          playerStore.setDuration(savedDuration)
        }
        if (shouldResumePlaying) {
          playerStore.play()
        } else {
          playerStore.pause()
        }

        if (playlistStore.currentIndex >= 0 && playlistStore.currentIndex < playlistStore.songs.length) {
          const currentSong = playlistStore.songs[playlistStore.currentIndex]
          const preserveTime = typeof savedTime === 'number'
          playerStore.setCurrentSong(currentSong, preserveTime)

          // 确保封面和歌词均已加载
          await lyricsStore.loadLyrics(currentSong)
          if (typeof savedLyricLine === 'number') {
            lyricsStore.setCurrentLine(savedLyricLine)
          } else if (typeof savedTime === 'number') {
            lyricsStore.updateCurrentLine(savedTime)
          }
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  function schedulePlaybackSnapshot() {
    if (playbackSnapshotTimer) return
    playbackSnapshotTimer = setTimeout(async () => {
      playbackSnapshotTimer = null
      await saveToStorage()
    }, 1000)
  }

  return {
    saveToStorage,
    loadFromStorage,
    schedulePlaybackSnapshot,
  }
}

