import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { useLyricsStore } from '../stores/lyrics'
import { getSongUrl } from '../api'
import { ensureSongArtwork, mapQualityToApiValue } from '../utils/song-utils'
import type { Song } from '../types'
import { useNotification } from './useNotification'

export function usePlayer() {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()
  const lyricsStore = useLyricsStore()
  const { show: showNotification } = useNotification()

  /**
   * 准备歌曲用于播放（获取播放地址）
   */
  async function prepareSongForPlayback(song: Song): Promise<Song> {
    const needsRefresh = !song.url || (song.resolvedQuality && song.resolvedQuality !== playerStore.quality)

    if (!needsRefresh && song.url) {
      return song
    }

    try {
      const response = await getSongUrl(song.id, song.source, mapQualityToApiValue(playerStore.quality))
      const playbackUrl = response?.data?.url

      if (!playbackUrl) {
        throw new Error('无法获取播放地址')
      }

      return {
        ...song,
        url: playbackUrl,
        resolvedQuality: playerStore.quality
      }
    } catch (error) {
      console.error('获取播放地址失败:', error)
      throw new Error('无法获取播放地址')
    }
  }

  /**
   * 在指定索引播放歌曲
   */
  async function playAtIndex(index: number): Promise<boolean> {
    if (playerStore.isLoading) return false
    if (index < 0 || index >= playlistStore.songs.length) return false

    const targetSong = playlistStore.songs[index]
    playerStore.setLoading(true)

    try {
      const playableSong = await prepareSongForPlayback(targetSong)
      const hydratedSong = await ensureSongArtwork(playableSong)
      
      // 更新播放列表中的歌曲
      playlistStore.songs[index] = hydratedSong
      playlistStore.currentIndex = index
      playerStore.setCurrentSong(hydratedSong)
      playerStore.play()

      // 加载歌词
      await lyricsStore.loadLyrics(hydratedSong)

      return true
    } catch (error: any) {
      console.error('播放失败:', error)
      playerStore.pause()
      showNotification(error?.message || '播放失败，请稍后重试', 'error')
      return false
    } finally {
      playerStore.setLoading(false)
    }
  }

  /**
   * 播放下一首
   */
  async function playNext() {
    if (playlistStore.songs.length === 0) return

    if (playerStore.playMode === 'single-loop') {
      playerStore.setCurrentTime(0)
      playerStore.play()
      return
    }
    if (playerStore.playMode === 'shuffle') {
      const randomIndex = Math.floor(Math.random() * playlistStore.songs.length)
      await playAtIndex(randomIndex)
      return
    }
    if (playlistStore.currentIndex < playlistStore.songs.length - 1) {
      await playAtIndex(playlistStore.currentIndex + 1)
    } else {
      await playAtIndex(0)
    }
  }

  /**
   * 播放上一首
   */
  async function playPrevious() {
    if (playlistStore.songs.length === 0) return

    if (playlistStore.currentIndex > 0) {
      await playAtIndex(playlistStore.currentIndex - 1)
    } else {
      await playAtIndex(playlistStore.songs.length - 1)
    }
  }

  /**
   * 重新加载当前歌曲（用于切换音质）
   */
  async function reloadCurrentSongWithNewQuality(): Promise<boolean> {
    if (!playerStore.currentSong || playlistStore.currentIndex < 0 || playlistStore.currentIndex >= playlistStore.songs.length) {
      return false
    }

    const wasPlaying = playerStore.isPlaying
    const targetTime = playerStore.currentTime || 0

    try {
      const targetIndex = playlistStore.currentIndex
      const playableSong = await prepareSongForPlayback(playlistStore.songs[targetIndex])
      const hydratedSong = await ensureSongArtwork(playableSong)
      playlistStore.songs[targetIndex] = hydratedSong
      playerStore.setCurrentSong(hydratedSong)

      // 重新加载歌词
      await lyricsStore.loadLyrics(hydratedSong)

      // 记录需要恢复的播放进度
      playerStore.setPendingSeekTime(targetTime)

      // 恢复之前的播放/暂停状态
      if (wasPlaying) {
        playerStore.play()
      } else {
        playerStore.pause()
      }

      return true
    } catch (error) {
      console.error('切换音质后重新加载当前歌曲失败:', error)
      return false
    }
  }

  /**
   * 补全当前歌曲的封面信息
   */
  async function hydrateCurrentSongArtwork() {
    if (!playerStore.currentSong) return
    const hydrated = await ensureSongArtwork(playerStore.currentSong)
    playerStore.setCurrentSong(hydrated)
    if (playlistStore.currentIndex >= 0 && playlistStore.currentIndex < playlistStore.songs.length) {
      playlistStore.songs[playlistStore.currentIndex] = hydrated
    }
  }

  return {
    prepareSongForPlayback,
    playAtIndex,
    playNext,
    playPrevious,
    reloadCurrentSongWithNewQuality,
    hydrateCurrentSongArtwork,
  }
}

