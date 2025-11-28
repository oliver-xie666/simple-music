<template>
  <div 
    id="app" 
    class="min-h-screen flex items-center justify-center m-0 bg-[#0f0f0f] transition-colors duration-500" 
    :class="[
      themeStore.isDark ? 'dark' : '',
      mobile.isMobileView.value ? mobileAppClasses : desktopAppClasses
    ]"
  >
    <!-- 背景渐变层 -->
    <div 
      class="fixed inset-0 pointer-events-none z-0 transition-opacity duration-[850ms]"
      :class="mobile.isMobileView.value ? 'hidden' : ''"
    >
      <div 
        class="absolute inset-0 transition-opacity duration-[850ms] opacity-100" 
        :style="{ background: themeStore.currentGradient }"
      ></div>
    </div>

    <!-- 移动端背景层（仅在竖屏时显示） -->
    <div 
      v-if="mobile.isMobileView.value"
      class="background-stage fixed inset-0 pointer-events-none z-[-4]"
    >
      <div 
        class="background-stage__layer absolute inset-0 transition-opacity duration-[850ms] opacity-100 [transform:scale(1.12)] [filter:saturate(112%)]" 
        :style="backgroundStageLayerStyle"
      ></div>
    </div>


    <!-- 主容器 -->
    <div 
      id="mainContainer"
      class="z-1 w-full mx-auto rounded-6 p-7.5 grid gap-5 transition-all duration-500 border shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
      :class="[
        themeStore.isDark ? 'bg-[#1e1e1e]/60 border-white/15' : 'bg-white/60 border-black/10',
        mobile.isMobileView.value ? ['mobile-container', mobileMainContainerClasses] : desktopMainContainerClasses
      ]"
    >
      <!-- 移动端容器高光效果 -->
      <div 
        v-if="mobile.isMobileView.value"
        class="absolute inset-0 pointer-events-none rounded-[32px] bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_65%)] opacity-60"
      ></div>
      <!-- 移动端工具栏 -->
      <div 
        v-if="mobile.isMobileView.value"
        class="mobile-toolbar flex items-center justify-between mt-[clamp(4px,3vw,12px)] z-2"
      >
        <button 
          @click="handleExploreRadar"
          class="w-10 h-10 rounded-full border border-white/12 bg-white/4 text-[#f5f7fa] backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-250"
        >
          <i class="fas fa-satellite-dish text-sm"></i>
        </button>
        <div 
          class="text-[1.05rem] font-semibold text-white tracking-[0.04em] text-center"
        >
          Simple Music
        </div>
        <div class="flex items-center gap-2.5">
          <button 
            @click="mobile.toggleSearch()"
            class="w-10 h-10 rounded-full border border-white/12 bg-white/4 text-[#f5f7fa] backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-250"
          >
            <i class="fas fa-search text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Header (桌面端) -->
      <div 
        v-if="!mobile.isMobileView.value"
        class="text-center relative [grid-area:header]" 
      >
        <h1 class="m-0 text-4xl font-bold text-[#1abc9c] tracking-wide">Simple Music</h1>
        <div class="text-0.9em mt-2.5 italic" :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'">
          Made by oliver-xie666，仅供学习交流使用，请支持正版音乐！
        </div>
        <div class="absolute top-0 right-0">
          <button 
            @click="themeStore.toggleTheme" 
            class="w-11 h-11 rounded-4 border flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-[12px] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
            :class="[
              themeStore.isDark ? 'bg-[#242a36]/90 border-[#1abc9c]/45' : 'bg-white/85 border-black/10',
            ]"
          >
            <i 
              class="fas fa-sun absolute text-lg text-[#f5a623] transition-all duration-350"
              :class="!themeStore.isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-[0.6] -rotate-[20deg]'"
            ></i>
            <i 
              class="fas fa-moon absolute text-lg text-[#a29bfe] transition-all duration-350"
              :class="themeStore.isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-[0.6] rotate-[20deg]'"
            ></i>
          </button>
        </div>
      </div>

      <!-- Search Area (桌面端) -->
      <SearchArea v-if="!mobile.isMobileView.value" />

      <!-- 移动端主内容区 -->
      <div 
        v-if="mobile.isMobileView.value"
        class="main-content flex flex-col gap-[clamp(16px,5vw,28px)] z-[1] flex-1 justify-start min-h-0"
      >
        <!-- Cover Area -->
        <CoverArea />

        <!-- Player Controls -->
        <PlayerControls />
      </div>

      <!-- 桌面端内容 -->
      <template v-if="!mobile.isMobileView.value">
        <!-- Cover Area -->
        <CoverArea />

        <!-- Playlist Area -->
        <PlaylistArea />

        <!-- Lyrics Area -->
        <LyricsArea />

        <!-- Player Controls -->
        <PlayerControls />
      </template>
    </div>

    <!-- 移动端搜索区域 (Teleported，以避免占据布局) -->
    <Teleport to="body" v-if="mobile.isMobileView.value">
      <SearchArea />
    </Teleport>

    <!-- 移动端覆盖层遮罩 -->
    <div 
      v-if="mobile.isMobileView.value"
      @click="mobile.closeAllOverlays()"
      class="mobile-overlay-scrim fixed inset-0 z-[40] transition-opacity duration-350 pointer-events-none bg-[rgba(4,6,10,0.55)]"
      :class="[
        mobile.isSearchOpen.value || mobile.isPanelOpen.value ? 'opacity-100 pointer-events-auto' : 'opacity-0'
      ]"
    ></div>

    <!-- 移动端面板 -->
    <div 
      v-if="mobile.isMobileView.value"
      class="mobile-panel fixed left-1/2 bottom-0 z-[400] w-full max-w-[420px] rounded-t-[28px] transition-transform duration-450 pointer-events-auto bg-[rgba(13,16,24,0.96)] backdrop-blur-[28px] px-[clamp(18px,6vw,28px)] pb-[calc(env(safe-area-inset-bottom,0px)+clamp(22px,7vw,32px))] pt-[18px] shadow-[0_-28px_60px_rgba(0,0,0,0.6)] h-[calc(100dvh_-_clamp(120px,34vw,200px))] max-h-[calc(100dvh_-_clamp(120px,34vw,200px))] flex flex-col gap-[18px] overflow-hidden overscroll-contain touch-pan-y"
      :class="[
        mobile.isPanelOpen.value ? 'translate-x-[-50%] translate-y-0' : 'translate-x-[-50%] translate-y-[110%]'
      ]"
    >
      <div class="flex flex-col gap-2">
        <!-- 拖拽手柄 -->
        <div 
          class="w-14 h-1 rounded-full mx-auto mb-2 bg-white/28"
        ></div>
        
        <!-- 标签页 -->
        <div class="flex items-center gap-2 mb-2">
          <div class="flex items-center gap-2 flex-1">
            <span class="text-white text-base font-semibold">播放列表</span>
          </div>
          <button
            @click="mobile.closePanel()"
            class="w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200"
            :class="themeStore.isDark ? 'bg-white/8 border-white/18 text-white hover:bg-white/14' : 'bg-white/8 border-white/18 text-white hover:bg-white/14'"
          >
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      <!-- 面板内容 -->
      <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
        <!-- 播放列表 -->
        <div 
          class="playlist flex flex-col flex-1 min-h-0 bg-transparent border-none p-0 max-h-none"
        >
          <div 
            class="playlist-scroll flex-1 overflow-y-auto pr-[6px] mr-[-6px] overscroll-contain touch-pan-y min-h-0"
            style="-webkit-overflow-scrolling: touch;"
          >
            <PlaylistArea />
          </div>
        </div>
      </div>
    </div>

    <!-- 通知 -->
    <div 
      v-if="notification.show"
      class="fixed top-4 right-4 z-[100000] px-4 py-2 rounded-3 border shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300"
      :class="[
        notification.type === 'success' ? 'bg-[#eafaf1] text-[#1e9f78] border-[#1abc9c]/30' : '',
        notification.type === 'error' ? 'bg-[#fdecea] text-[#e74c3c] border-[#e74c3c]/30' : '',
        notification.type === 'warning' ? 'bg-[#fff4e5] text-[#e67e22] border-[#e67e22]/30' : '',
        notification.type === 'info' ? 'bg-[#e8f4fd] text-[#2980b9] border-[#2980b9]/30' : ''
      ]"
    >
      {{ notification.message }}
    </div>

    <!-- Audio Element -->
    <audio 
      ref="audioRef" 
      preload="auto"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @canplay="onCanPlay"
      @error="onError"
      class="hidden"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, provide, computed } from 'vue'
import { usePlayerStore } from './stores/player'
import { usePlaylistStore } from './stores/playlist'
import { useThemeStore } from './stores/theme'
import { useLyricsStore } from './stores/lyrics'
import { usePlayer } from './composables/usePlayer'
import { useNotification } from './composables/useNotification'
import { useStorage } from './composables/useStorage'
import { useDownload } from './composables/useDownload'
import { useMobile } from './composables/useMobile'
import SearchArea from './components/SearchArea.vue'
import CoverArea from './components/CoverArea.vue'
import PlaylistArea from './components/PlaylistArea.vue'
import LyricsArea from './components/LyricsArea.vue'
import PlayerControls from './components/PlayerControls.vue'

const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const themeStore = useThemeStore()
const lyricsStore = useLyricsStore()
const { playNext, hydrateCurrentSongArtwork, playAtIndex } = usePlayer()
const { show: showNotification, notification } = useNotification()
const { loadFromStorage, saveToStorage, schedulePlaybackSnapshot } = useStorage()
const { cancelAllDownloads } = useDownload()
const mobile = useMobile()

// 提供移动端状态给子组件
provide('isMobileLayout', mobile.isMobileView)
provide('mobile', mobile)

const desktopAppClasses = 'p-5 box-border'

const mobileAppClasses = computed(() =>
  mobile.isMobileView.value
    ? 'mobile-view fixed inset-0 w-full h-[var(--mobile-vh,100dvh)] min-h-[var(--mobile-vh,100dvh)] overflow-hidden touch-pan-y overscroll-none flex justify-center items-stretch px-[clamp(12px,5vw,24px)] pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-[calc(env(safe-area-inset-bottom,0px)+20px)] bg-[radial-gradient(120%_140%_at_50%_0%,#1b1d24_0%,#0d1018_70%,#05070c_100%)] text-[#f2f5f9] bg-fixed box-border'
    : ''
)

const mobileMainContainerClasses = computed(() =>
  mobile.isMobileView.value
    ? 'max-w-[min(420px,_calc(100vw_-_clamp(24px,8vw,48px)))] w-full bg-[linear-gradient(180deg,_rgba(27,29,36,0.92),_rgba(7,9,14,0.95))] rounded-[32px] px-[clamp(16px,5vw,28px)] pt-[calc(env(safe-area-inset-top,0px)+clamp(18px,6vw,32px))] pb-[calc(env(safe-area-inset-bottom,0px)+clamp(22px,7vw,32px))] shadow-[0_32px_90px_rgba(0,0,0,0.65)] flex flex-col gap-[clamp(12px,4vw,24px)] overflow-visible flex-1 min-h-[calc(var(--mobile-vh,100dvh)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] box-border'
    : ''
)

const desktopMainContainerClasses = 'max-w-[min(1400px,100%)] h-[85vh] max-h-[900px] grid backdrop-blur-[10px]'

const backgroundStageLayerStyle = computed(() => ({
  background: themeStore.currentGradient,
  WebkitMaskImage: 'radial-gradient(circle at 50% calc(50% + var(--mobile-ring-vertical-shift, -24px)), transparent calc(var(--mobile-ring-inner-radius, 280px)), rgba(0, 0, 0, 0.92) calc(var(--mobile-ring-inner-radius, 280px) + var(--mobile-ring-feather, 120px)), rgba(0, 0, 0, 1) 100%)',
  maskImage: 'radial-gradient(circle at 50% calc(50% + var(--mobile-ring-vertical-shift, -24px)), transparent calc(var(--mobile-ring-inner-radius, 280px)), rgba(0, 0, 0, 0.92) calc(var(--mobile-ring-inner-radius, 280px) + var(--mobile-ring-feather, 120px)), rgba(0, 0, 0, 1) 100%)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'cover',
  maskSize: 'cover',
  WebkitMaskPosition: 'center',
  maskPosition: 'center'
}))

// 探索雷达处理函数
async function handleExploreRadar() {
  if (isExploring.value) return
  isExploring.value = true

  try {
    const EXPLORE_RADAR_GENRES = ['流行', '摇滚', '古典音乐', '民谣', '电子', '爵士', '说唱', '乡村', '蓝调', 'R&B', '金属', '嘻哈', '轻音乐']
    const EXPLORE_RADAR_SOURCES = ['netease', 'kuwo']
    
    const randomGenre = EXPLORE_RADAR_GENRES[Math.floor(Math.random() * EXPLORE_RADAR_GENRES.length)]
    const source = EXPLORE_RADAR_SOURCES[Math.floor(Math.random() * EXPLORE_RADAR_SOURCES.length)]

    const { searchMusic } = await import('./api')
    const response = await searchMusic(randomGenre, source, 1, 30)
    
    const data = response?.data

    if (!Array.isArray(data) || data.length === 0) {
      showNotification('探索雷达：未找到歌曲', 'error')
      return
    }

    const { normalizeArtistField } = await import('./utils/song-utils')
    const existingKeys = new Set(
      (playlistStore.songs || []).map((song: any) => `${song.source || 'netease'}:${song.id}`)
    )

    const candidates = data.map((item: any) => {
      const id = String(item.id ?? item.url_id ?? Math.random())
      const key = `${item.source || source}:${id}`
      return {
        key,
        song: {
          id,
          name: item.name ?? item.title ?? '未知歌曲',
          artist: normalizeArtistField(item.artist),
          album: item.album ?? '未知专辑',
          cover: typeof item.pic === 'string' ? item.pic : '',
          picId: item.pic_id || item.picId || item.pic_str || undefined,
          url: typeof item.url === 'string' ? item.url : '',
          urlId: item.url_id || item.urlId || undefined,
          lrc: typeof item.lrc === 'string' ? item.lrc : '',
          lyricId: item.lyric_id || item.lyricId || item.id || undefined,
          duration: Number(item.time ?? item.duration ?? 0) || 0,
          source: item.source || source
        }
      }
    })

    let appended = 0
    for (const { key, song } of candidates) {
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      playlistStore.addSong(song as any)
      appended++
    }

    if (appended === 0) {
      showNotification('探索雷达：本次未找到新的歌曲，当前列表已包含这些曲目', 'info')
    } else {
      showNotification(`探索雷达：新增${appended}首 ${randomGenre} 歌曲`, 'success')
    }

    const firstCandidate = candidates[0]
    if (firstCandidate && appended > 0) {
      const targetIndex = (playlistStore.songs || []).findIndex(
        (s: any) => s.id === firstCandidate.song.id && (s.source || 'netease') === (firstCandidate.song.source || 'netease')
      )

      if (targetIndex >= 0) {
        await playAtIndex(targetIndex)
      }
    }
  } catch (error) {
    console.error('探索雷达错误:', error)
    showNotification('探索雷达获取失败，请稍后重试', 'error')
  } finally {
    isExploring.value = false
  }
}

const isExploring = ref(false)

const audioRef = ref<HTMLAudioElement | null>(null)
// 标记是否正在切换音质，用于阻止进度更新导致的闪烁
const isQualitySwitching = ref(false)
// 标记是否是用户主动播放（用于判断是否显示播放失败通知）
const isUserInitiatedPlay = ref(false)
// 标记是否正在从存储恢复播放状态（启动时）
const isRestoringFromStorage = ref(true)

/**
 * 等待音频元数据加载完成（
 * 只等待 loadedmetadata 事件，不等待 canplay，以实现立即播放
 */
function waitForAudioReady(player: HTMLAudioElement): Promise<void> {
  if (!player) return Promise.resolve()
  // 如果元数据已经加载，立即返回
  if (player.readyState >= 1) { // HAVE_METADATA
    return Promise.resolve()
  }
  // 否则等待 loadedmetadata 事件
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      player.removeEventListener('loadedmetadata', onLoaded)
      player.removeEventListener('error', onError)
    }
    const onLoaded = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('音频加载失败'))
    }
    player.addEventListener('loadedmetadata', onLoaded, { once: true })
    player.addEventListener('error', onError, { once: true })
  })
}

// 监听播放状态
watch(() => playerStore.isPlaying, (playing: boolean) => {
  if (audioRef.value) {
    if (playing) {
      // 如果不是从存储恢复，则标记为用户主动播放
      if (!isRestoringFromStorage.value) {
        isUserInitiatedPlay.value = true
      }
      audioRef.value.play().catch((err: any) => {
        console.error('播放失败:', err)
        playerStore.pause()
        // 只有在用户主动播放时才显示错误通知
        if (isUserInitiatedPlay.value && !isRestoringFromStorage.value) {
          showNotification('播放失败，请尝试其他音质', 'error')
        }
      })
    } else {
      audioRef.value.pause()
    }
  }
  schedulePlaybackSnapshot()
})

// 监听当前歌曲变化：切换音频源，并确保补全封面信息（如果缺失）
watch(() => playerStore.currentSong, async (song: any, oldSong: any) => {
  if (!audioRef.value) return

  if (!song) {
    const audio = audioRef.value
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    audio.currentTime = 0
    playerStore.setCurrentTime(0)
    playerStore.setDuration(0)
    playerStore.setPendingSeekTime(null)
    lyricsStore.clearLyrics()
    isQualitySwitching.value = false
    return
  }
  
  // 如果是切换音质（同一首歌，只是 URL 不同），不重置进度
  const isQualitySwitch = oldSong && song.id === oldSong.id && song.url !== oldSong.url
  
  if (isQualitySwitch) {
    // 标记正在切换音质，阻止 onTimeUpdate 更新进度（避免闪烁）
    isQualitySwitching.value = true
    
    // 获取待恢复的播放进度（在设置新 URL 之前获取，确保准确）
    const pendingTime = playerStore.pendingSeekTime || playerStore.currentTime || 0
    const wasPlaying = playerStore.isPlaying
 
    // 保持 store 中的 currentTime，避免 UI 显示为 0
    if (pendingTime > 0) {
      playerStore.setCurrentTime(pendingTime)
    }
    
    // 先暂停当前播放
    audioRef.value.pause()
    
    // 设置新的音频源
    audioRef.value.src = song.url
    audioRef.value.load()
    
    try {
      // 等待元数据加载完成
      await waitForAudioReady(audioRef.value)
      
      // 元数据加载完成后，立即设置进度并播放
      if (pendingTime > 0 && audioRef.value) {
        const clamped = Math.min(Math.max(pendingTime, 0), audioRef.value.duration || pendingTime)
        audioRef.value.currentTime = clamped
        playerStore.setCurrentTime(clamped)
        playerStore.setPendingSeekTime(null)
      }
      
      // 如果之前正在播放，立即播放（不等待 canplay）
      if (wasPlaying && audioRef.value) {
        const playPromise = audioRef.value.play()
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            console.error('[DEBUG] 播放失败:', err)
            playerStore.pause()
          })
        }
      }
      
      isQualitySwitching.value = false
    } catch (error) {
      console.error('[DEBUG] 等待音频元数据加载失败:', error)
      isQualitySwitching.value = false
      playerStore.pause()
      showNotification('切换音质失败，请稍后重试', 'error')
    }
  } else {
    // 切换歌曲时，优先保留待恢复的播放进度（例如从本地恢复播放）
    const pendingResumeTime = typeof playerStore.pendingSeekTime === 'number' && isFinite(playerStore.pendingSeekTime)
      ? playerStore.pendingSeekTime
      : null
    const estimatedDuration = typeof song.duration === 'number' && song.duration > 0
      ? song.duration
      : null

    if (pendingResumeTime !== null) {
      playerStore.setCurrentTime(pendingResumeTime)
    } else {
      playerStore.setCurrentTime(0)
    }

    if (estimatedDuration !== null) {
      playerStore.setDuration(estimatedDuration)
    } else if (pendingResumeTime === null) {
      playerStore.setDuration(0)
    }

    audioRef.value.src = song.url
    audioRef.value.load()
    
    // 尝试为当前歌曲补全封面（如果没有封面但有 picId，会触发封面接口）
    // 注意：切换音质时不需要调用，因为 reloadCurrentSongWithNewQuality 已经在后台处理了
    hydrateCurrentSongArtwork()
  }
})

// 监听音量变化
watch(() => playerStore.volume, (vol: number) => {
  if (audioRef.value) {
    audioRef.value.volume = vol
  }
})

type SeekEventDetail = number | { time?: number; ratio?: number }

function resolveSeekTime(detail: SeekEventDetail, duration: number): number | null {
  if (typeof detail === 'number') {
    if (duration <= 0) return null
    return detail * duration
  }
  if (!detail || typeof detail !== 'object') return null
  if (typeof detail.time === 'number' && !Number.isNaN(detail.time)) {
    return detail.time
  }
  if (typeof detail.ratio === 'number' && duration > 0) {
    return detail.ratio * duration
  }
  return null
}

const handleExternalSeek = (event: Event) => {
  if (!audioRef.value) return
  const customEvent = event as CustomEvent<SeekEventDetail>
  const audio = audioRef.value
  const mediaDuration = (audio.duration && Number.isFinite(audio.duration) ? audio.duration : playerStore.duration) || 0
  const targetTime = resolveSeekTime(customEvent.detail, mediaDuration)
  if (targetTime === null) return

  const clamped = mediaDuration > 0
    ? Math.min(Math.max(targetTime, 0), mediaDuration)
    : Math.max(targetTime, 0)

  if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = clamped
    playerStore.setPendingSeekTime(null)
  } else {
    playerStore.setPendingSeekTime(clamped)
  }

  playerStore.setCurrentTime(clamped)
  lyricsStore.updateCurrentLine(clamped)
  schedulePlaybackSnapshot()
}

function onTimeUpdate() {
  if (audioRef.value) {
    // 如果正在切换音质，不更新进度和当前歌词行（避免先跳到 0 秒再跳回来的闪烁）
    if (!isQualitySwitching.value) {
      playerStore.setCurrentTime(audioRef.value.currentTime)
      lyricsStore.updateCurrentLine(audioRef.value.currentTime)
    }
    schedulePlaybackSnapshot()
  }
}

function onLoadedMetadata() {
  if (audioRef.value) {
    playerStore.setDuration(audioRef.value.duration)

    // 如果存在待恢复的播放进度（例如切换音质后），在元数据就绪时恢复
    // 注意：切换音质的逻辑已经在 watch 中通过 waitForAudioReady 处理了
    // 这里只处理非切换音质的情况
    const pending = playerStore.pendingSeekTime
    if (!isQualitySwitching.value && typeof pending === 'number' && pending > 0 && isFinite(pending)) {
      const clamped = Math.min(Math.max(pending, 0), audioRef.value.duration || pending)
      audioRef.value.currentTime = clamped
      playerStore.setCurrentTime(clamped)
      playerStore.setPendingSeekTime(null)
    }
  }
}

function onEnded() {
  playNext()
}

function onCanPlay() {
  playerStore.setLoading(false)
  
  // 切换音质的逻辑已经在 watch 中通过 waitForAudioReady 处理了
  // 这里只处理非切换音质的情况
  if (!isQualitySwitching.value) {
    // 如果存在待恢复的播放进度，在音频可以播放时恢复
    const pending = playerStore.pendingSeekTime
    if (audioRef.value && typeof pending === 'number' && pending > 0 && isFinite(pending)) {
      const clamped = Math.min(Math.max(pending, 0), audioRef.value.duration || pending)
      audioRef.value.currentTime = clamped
      playerStore.setCurrentTime(clamped)
      playerStore.setPendingSeekTime(null)
    }
    
    // 当音频可以播放时，如果当前是"播放"状态，确保真正开始播放
    if (audioRef.value && playerStore.isPlaying) {
      audioRef.value.play().catch((err: any) => {
        console.error('播放失败(onCanPlay):', err)
        playerStore.pause()
        // 只有在用户主动播放时才显示错误通知
        if (isUserInitiatedPlay.value && !isRestoringFromStorage.value) {
          showNotification('播放失败，请尝试其他音质', 'error')
        }
      })
    }
  }
}

function onError() {
  playerStore.setLoading(false)
  playerStore.pause()
  // 只有在用户主动播放时才显示错误通知（启动时自动恢复播放不显示）
  if (isUserInitiatedPlay.value && !isRestoringFromStorage.value) {
    showNotification('播放失败，请尝试其他音质', 'error')
  }
}

// 初始化
loadFromStorage().then(() => {
  // 恢复完成后，标记为已完成恢复
  // 使用 setTimeout 确保所有恢复操作都已完成
  setTimeout(() => {
    isRestoringFromStorage.value = false
  }, 1000)
})
if (audioRef.value) {
  audioRef.value.volume = playerStore.volume
}

// 应用关闭时的清理函数
function handleBeforeUnload() {
  // 保存数据
  saveToStorage()
  // 取消所有正在进行的下载并删除未完成的文件（同步调用，内部异步处理）
  cancelAllDownloads()
}

// 页面隐藏时也执行清理（用户切换标签页或最小化窗口）
function handleVisibilityChange() {
  if (document.hidden) {
    // 页面隐藏时取消所有下载（可选，根据需求决定是否启用）
    // cancelAllDownloads()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('seek-audio', handleExternalSeek)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('seek-audio', handleExternalSeek)
  // 组件卸载时也执行清理
  cancelAllDownloads()
})
</script>
<style>
@media (min-width: 900px) {
  #mainContainer {
    grid-template-areas: 
      'header header header'
      'search search search'
      'cover playlist lyrics'
      'controls controls controls' !important;
    grid-template-rows: auto auto 1fr 80px !important;
    grid-template-columns: 1fr 1fr 1fr !important;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

::-webkit-scrollbar-thumb:hover {
  background: #1abc9c;
}
</style>


