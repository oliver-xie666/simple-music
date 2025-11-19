<template>
  <div id="app" class="min-h-screen flex items-center justify-center p-5 m-0 box-border bg-[#0f0f0f] transition-colors duration-500" :class="themeStore.isDark ? 'dark' : ''">
    <!-- 背景渐变层 -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div 
        class="absolute inset-0 transition-opacity duration-[850ms]" 
        :style="{ 
          background: themeStore.currentGradient,
          opacity: 1 
        }"
      ></div>
    </div>

    <!-- 主容器 - 16:9 Grid 布局 -->
    <div 
      id="mainContainer"
      class="relative z-1 w-full mx-auto rounded-6 p-7.5 grid gap-5 transition-all duration-500 border shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
      :class="[
        themeStore.isDark ? 'bg-[#1e1e1e]/60 border-white/15' : 'bg-white/60 border-black/10'
      ]"
      :style="{
        maxWidth: 'min(1400px, 100%)',
        height: '85vh',
        maxHeight: '900px',
        gridTemplateAreas: `
          'header'
          'search'
          'cover'
          'playlist'
          'lyrics'
          'controls'
        `,
        gridTemplateRows: 'auto auto 1fr 1fr 1fr auto',
        gridTemplateColumns: '1fr',
        backdropFilter: 'blur(10px)'
      }"
    >
      <!-- Header -->
      <div class="text-center relative" style="grid-area: header;">
        <h1 class="m-0 text-4xl font-bold text-[#1abc9c] tracking-wide">Simple Music</h1>
        <div class="text-0.9em mt-2.5 italic" :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'">
          Made by oliver-xie666，仅供学习交流使用，请支持正版音乐！
        </div>
        <div class="absolute top-0 right-0">
          <button 
            @click="themeStore.toggleTheme" 
            class="w-11 h-11 rounded-4 border flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden"
            :class="[
              themeStore.isDark ? 'bg-[#242a36]/90 border-[#1abc9c]/45' : 'bg-white/85 border-black/10',
            ]"
            style="backdrop-filter: blur(12px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);"
          >
            <i 
              class="fas fa-sun absolute text-lg text-[#f5a623] transition-all duration-350"
              :style="!themeStore.isDark ? 'opacity: 1; transform: scale(1) rotate(0deg)' : 'opacity: 0; transform: scale(0.6) rotate(-20deg)'"
            ></i>
            <i 
              class="fas fa-moon absolute text-lg text-[#a29bfe] transition-all duration-350"
              :style="themeStore.isDark ? 'opacity: 1; transform: scale(1) rotate(0deg)' : 'opacity: 0; transform: scale(0.6) rotate(20deg)'"
            ></i>
          </button>
        </div>
      </div>

      <!-- Search Area -->
      <SearchArea />

      <!-- Cover Area -->
      <CoverArea />

      <!-- Playlist Area -->
      <PlaylistArea />

      <!-- Lyrics Area -->
      <LyricsArea />

      <!-- Player Controls -->
      <PlayerControls />
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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlayerStore } from './stores/player'
import { useThemeStore } from './stores/theme'
import { useLyricsStore } from './stores/lyrics'
import { usePlayer } from './composables/usePlayer'
import { useNotification } from './composables/useNotification'
import { useStorage } from './composables/useStorage'
import SearchArea from './components/SearchArea.vue'
import CoverArea from './components/CoverArea.vue'
import PlaylistArea from './components/PlaylistArea.vue'
import LyricsArea from './components/LyricsArea.vue'
import PlayerControls from './components/PlayerControls.vue'

const playerStore = usePlayerStore()
const themeStore = useThemeStore()
const lyricsStore = useLyricsStore()
const { playNext, hydrateCurrentSongArtwork } = usePlayer()
const { show: showNotification, notification } = useNotification()
const { loadFromStorage, saveToStorage, schedulePlaybackSnapshot } = useStorage()

const audioRef = ref<HTMLAudioElement | null>(null)
// 标记是否正在切换音质，用于阻止进度更新导致的闪烁
const isQualitySwitching = ref(false)

/**
 * 等待音频元数据加载完成（参考 Solara 的 waitForAudioReady）
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
      audioRef.value.play().catch((err: any) => {
        console.error('播放失败:', err)
        playerStore.pause()
      })
    } else {
      audioRef.value.pause()
    }
  }
  schedulePlaybackSnapshot()
})

// 监听当前歌曲变化：切换音频源，并确保补全封面信息（如果缺失）
watch(() => playerStore.currentSong, async (song: any, oldSong: any) => {
  if (!audioRef.value || !song) return
  
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
    
    // 先暂停当前播放（参考 Solara：释放资源，加快切换）
    audioRef.value.pause()
    
    // 设置新的音频源
    audioRef.value.src = song.url
    audioRef.value.load()
    
    try {
      // 等待元数据加载完成（参考 Solara：只等待 loadedmetadata，不等待 canplay）
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

// 监听进度搜索
window.addEventListener('seek-audio', ((e: CustomEvent) => {
  if (audioRef.value && playerStore.duration) {
    audioRef.value.currentTime = e.detail * playerStore.duration
    schedulePlaybackSnapshot()
  }
}) as EventListener)

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
      })
    }
  }
}

function onError() {
  playerStore.setLoading(false)
  playerStore.pause()
  showNotification('播放失败，请尝试其他音质', 'error')
}

// 初始化
loadFromStorage()
if (audioRef.value) {
  audioRef.value.volume = playerStore.volume
}

onMounted(() => {
  window.addEventListener('beforeunload', saveToStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', saveToStorage)
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

