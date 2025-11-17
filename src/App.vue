<template>
  <div id="app" class="min-h-screen flex items-center justify-center p-5 m-0 box-border bg-[#0f0f0f] transition-colors duration-500" :class="store.isDark ? 'dark' : ''">
    <!-- 背景渐变层 -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div 
        class="absolute inset-0 transition-opacity duration-[850ms]" 
        :style="{ 
          background: store.currentGradient,
          opacity: 1 
        }"
      ></div>
    </div>

    <!-- 主容器 - 16:9 Grid 布局 -->
    <div 
      id="mainContainer"
      class="relative z-1 w-full mx-auto rounded-6 p-7.5 grid gap-5 transition-all duration-500 border shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
      :class="[
        store.isDark ? 'bg-[#1e1e1e]/60 border-white/15' : 'bg-white/60 border-black/10'
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
        <div class="text-0.9em mt-2.5 italic" :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'">
          Made by oliver-xie666，仅供学习交流使用，请支持正版音乐！
        </div>
        <div class="absolute top-0 right-0">
          <button 
            @click="store.toggleTheme" 
            class="w-11 h-11 rounded-4 border flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden"
            :class="[
              store.isDark ? 'bg-[#242a36]/90 border-[#1abc9c]/45' : 'bg-white/85 border-black/10',
            ]"
            style="backdrop-filter: blur(12px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);"
          >
            <i 
              class="fas fa-sun absolute text-lg text-[#f5a623] transition-all duration-350"
              :style="!store.isDark ? 'opacity: 1; transform: scale(1) rotate(0deg)' : 'opacity: 0; transform: scale(0.6) rotate(-20deg)'"
            ></i>
            <i 
              class="fas fa-moon absolute text-lg text-[#a29bfe] transition-all duration-350"
              :style="store.isDark ? 'opacity: 1; transform: scale(1) rotate(0deg)' : 'opacity: 0; transform: scale(0.6) rotate(20deg)'"
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
      v-if="store.notification.show"
      class="fixed top-4 right-4 z-[100000] px-4 py-2 rounded-3 border shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300"
      :class="[
        store.notification.type === 'success' ? 'bg-[#eafaf1] text-[#1e9f78] border-[#1abc9c]/30' : '',
        store.notification.type === 'error' ? 'bg-[#fdecea] text-[#e74c3c] border-[#e74c3c]/30' : '',
        store.notification.type === 'warning' ? 'bg-[#fff4e5] text-[#e67e22] border-[#e67e22]/30' : '',
        store.notification.type === 'info' ? 'bg-[#e8f4fd] text-[#2980b9] border-[#2980b9]/30' : ''
      ]"
    >
      {{ store.notification.message }}
    </div>

    <!-- Audio Element -->
    <audio 
      ref="audioRef" 
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
import { ref, watch } from 'vue'
import { useAppStore } from './store'
import SearchArea from './components/SearchArea.vue'
import CoverArea from './components/CoverArea.vue'
import PlaylistArea from './components/PlaylistArea.vue'
import LyricsArea from './components/LyricsArea.vue'
import PlayerControls from './components/PlayerControls.vue'

const store = useAppStore()
const audioRef = ref<HTMLAudioElement | null>(null)

// 监听播放状态
watch(() => store.isPlaying, (playing: boolean) => {
  if (!audioRef.value) return
  if (playing) {
    audioRef.value.play().catch((err: any) => {
      console.error('播放失败:', err)
      store.pause()
    })
  } else {
    audioRef.value.pause()
  }
})

// 监听当前歌曲变化：切换音频源，并确保补全封面信息（如果缺失）
watch(() => store.currentSong, (song: any) => {
  if (!audioRef.value || !song) return
  audioRef.value.src = song.url
  audioRef.value.load()
  // 切歌时重置进度
  store.currentTime = 0
  store.duration = 0
  // 尝试为当前歌曲补全封面（如果没有封面但有 picId，会触发封面接口）
  store.hydrateCurrentSongArtwork?.()
})

// 监听音量变化
watch(() => store.volume, (vol: number) => {
  if (audioRef.value) {
    audioRef.value.volume = vol
  }
})

// 监听进度搜索
window.addEventListener('seek-audio', ((e: CustomEvent) => {
  if (audioRef.value && store.duration) {
    audioRef.value.currentTime = e.detail * store.duration
  }
}) as EventListener)

function onTimeUpdate() {
  if (audioRef.value) {
    store.currentTime = audioRef.value.currentTime
    store.updateLyricIndex()
  }
}

function onLoadedMetadata() {
  if (audioRef.value) {
    store.duration = audioRef.value.duration

    // 如果存在待恢复的播放进度（例如切换音质后），在元数据就绪时恢复
    const pending = store.pendingSeekTime
    if (typeof pending === 'number' && pending > 0 && isFinite(pending)) {
      const clamped = Math.min(Math.max(pending, 0), audioRef.value.duration || pending)
      audioRef.value.currentTime = clamped
      store.currentTime = clamped
      store.setPendingSeekTime(null)
    }
  }
}

function onEnded() {
  store.playNext()
}

function onCanPlay() {
  store.isLoading = false
  // 当音频可以播放时，如果当前是“播放”状态，确保真正开始播放
  if (audioRef.value && store.isPlaying) {
    audioRef.value.play().catch((err: any) => {
      console.error('播放失败(onCanPlay):', err)
      store.pause()
    })
  }
}

function onError() {
  store.isLoading = false
  store.pause()
  store.showNotification('播放失败，请尝试其他音质', 'error')
}

// 初始化
store.loadFromStorage()
if (audioRef.value) {
  audioRef.value.volume = store.volume
}
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

