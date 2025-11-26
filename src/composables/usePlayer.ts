import { usePlayerStore } from '../stores/player'
import { usePlaylistStore } from '../stores/playlist'
import { useLyricsStore } from '../stores/lyrics'
import { getSongUrl } from '../api'
import { ensureSongArtwork, mapQualityToApiValue } from '../utils/song-utils'
import { buildAudioProxyUrl, preferHttpsUrl } from '../utils/url-utils'
import type { Song } from '../types'
import { useNotification } from './useNotification'

export function usePlayer() {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()
  const lyricsStore = useLyricsStore()
  const { show: showNotification } = useNotification()

  /**
   * 准备歌曲用于播放（获取播放地址）
   * 处理代理 URL 和 HTTPS 升级
   */
  async function prepareSongForPlayback(song: Song): Promise<Song> {
    const needsRefresh = !song.url || (song.resolvedQuality && song.resolvedQuality !== playerStore.quality)

    if (!needsRefresh && song.url) {
      return song
    }

    try {
      // 1. 调用 /proxy?types=url 获取音频 URL
      const response = await getSongUrl(song.id, song.source, mapQualityToApiValue(playerStore.quality))
      const originalAudioUrl = response?.data?.url

      if (!originalAudioUrl) {
        throw new Error('无法获取播放地址')
      }

      // 2. 处理代理 URL 和 HTTPS 升级
      // 对于 kuwo.cn 的 HTTP 链接，通过 /proxy?target=... 代理
      const proxiedAudioUrl = buildAudioProxyUrl(originalAudioUrl)
      const preferredAudioUrl = preferHttpsUrl(originalAudioUrl)
      
      // 构建候选 URL 列表（优先级：代理 > HTTPS > 原始）
      const candidateAudioUrls = Array.from(
        new Set([proxiedAudioUrl, preferredAudioUrl, originalAudioUrl].filter(Boolean))
      )

      const primaryAudioUrl = candidateAudioUrls[0] || originalAudioUrl

      // 3. 返回处理后的歌曲对象
      return {
        ...song,
        url: primaryAudioUrl,
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
   * 优化：获取 URL 后立即设置音频源，不等待封面和歌词
   */
  async function reloadCurrentSongWithNewQuality(): Promise<boolean> {
    if (!playerStore.currentSong || playlistStore.currentIndex < 0 || playlistStore.currentIndex >= playlistStore.songs.length) {
      return false
    }

    // 记录播放状态和进度（从 audio 元素获取，更准确）
    const audioElement = document.querySelector('audio') as HTMLAudioElement | null
    const wasPlaying = playerStore.isPlaying
    const targetTime = audioElement?.currentTime || playerStore.currentTime || 0

    try {
      const targetIndex = playlistStore.currentIndex
      const currentSong = playlistStore.songs[targetIndex]

      // 1. 先设置待恢复的播放进度（在更新歌曲之前，这样 watch 触发时就能知道需要保留进度）
      // 同时保持 store 中的 currentTime，避免 UI 显示为 0
      if (targetTime > 0) {
        playerStore.setPendingSeekTime(targetTime)
        playerStore.setCurrentTime(targetTime) // 保持 UI 显示，避免闪烁
      } else {
        playerStore.setPendingSeekTime(null)
      }

      // 2. 准备歌曲（获取新音质的 URL，处理代理等）
      // 这是唯一阻塞的操作，必须等待 URL 获取完成
      const playableSong = await prepareSongForPlayback(currentSong)

      // 3. 立即更新播放列表和当前歌曲（只更新 URL，不等待封面和歌词）
      //    这会触发 App.vue 中的 watch，立即设置音频源并开始加载
      playlistStore.songs[targetIndex] = playableSong
      playerStore.setCurrentSong(playableSong, true) // preserveTime = true

      // 4. 在后台仅补全封面信息，不再重新加载歌词
      // 说明：
      // - 切换音质时歌曲本身没有变化，歌词内容相同
      // - 重新加载歌词会清空并重建歌词列表，导致滚动位置回到顶部，再跳回当前行，体验很差
      // 因此这里只异步刷新封面，保留现有歌词和滚动位置
      ensureSongArtwork(playableSong)
        .then((hydratedSong) => {
          // 更新封面信息（如果获取成功）
          playlistStore.songs[targetIndex] = hydratedSong
          playerStore.setCurrentSong(hydratedSong, true) // preserveTime = true
        })
        .catch((err) => {
          console.warn('[DEBUG] 获取封面失败（不影响播放）:', err)
        })

      // 5. 恢复播放状态（watch 中会处理实际的播放逻辑）
      // 注意：如果之前未播放，切换后也不播放；如果之前正在播放，切换后继续播放
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
    // 补全封面时保留播放进度（只是更新封面，不是切换歌曲）
    playerStore.setCurrentSong(hydrated, true)
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

