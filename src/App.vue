<template>
  <div 
    class="min-h-screen flex items-center justify-center p-5"
    :class="store.isDark ? 'bg-gray-950' : 'bg-gray-100'"
  >
    <!-- 背景渐变层 -->
    <div 
      class="fixed inset-0 -z-10 transition-opacity duration-1000"
      :style="{ backgroundImage: store.currentGradient }"
    ></div>

    <!-- 主容器 - Grid 布局（完全按照 Solara） -->
    <div 
      class="w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden grid"
      style="grid-template-areas: 'header header' 'search search' 'cover playlist' 'controls controls'; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto 1fr auto;"
      :class="store.isDark ? 'bg-gray-900/60 backdrop-blur-xl' : 'bg-white/60 backdrop-blur-xl'"
    >
      <!-- Header -->
      <div class="px-8 py-6 flex justify-between items-start border-b border-gray-300/30 dark:border-gray-600/30" style="grid-area: header;">
        <div>
          <h1 class="text-4xl font-800 mb-2 bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
            Simple Music
          </h1>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Made with ❤️ | 仅供学习交流使用
          </div>
        </div>
        <button 
          @click="store.toggleTheme()"
          class="w-12 h-12 rounded-full bg-white/50 dark:bg-gray-700/50 backdrop-blur flex items-center justify-center hover:scale-110 transition shadow-lg"
        >
          <i v-if="!store.isDark" class="i-carbon-sun text-2xl text-yellow-500"></i>
          <i v-else class="i-carbon-moon text-2xl text-blue-400"></i>
        </button>
      </div>

      <!-- Search Area -->
      <SearchArea />

      <!-- Cover Area (左侧) -->
      <CoverArea />

      <!-- Playlist Area (右侧) -->
      <PlaylistArea />

      <!-- Controls (底部) -->
      <PlayerControls />
    </div>

    <!-- Audio Element -->
    <audio 
      ref="audioRef"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="store.playNext()"
      @canplay="onCanPlay"
      @error="onError"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAppStore } from './store'
import SearchArea from './components/SearchArea.vue'
import CoverArea from './components/CoverArea.vue'
import PlaylistArea from './components/PlaylistArea.vue'
import PlayerControls from './components/PlayerControls.vue'

const store = useAppStore()
const audioRef = ref<HTMLAudioElement>()

watch(() => store.currentSong, async (song) => {
  if (!song || !audioRef.value) return
  store.setLoading(true)
  try {
    const response = await window.electronAPI.fetchMusicUrl({
      id: song.url_id || song.id,
      source: song.source,
      quality: store.quality
    })
    if (response && response.success && response.data && response.data.url) {
      audioRef.value.src = response.data.url
      audioRef.value.load()
      store.loadLyrics(song.lyric_id || song.id, song.source)
    }
  } catch (error) {
    console.error('加载失败:', error)
    store.setLoading(false)
  }
})

watch(() => store.isPlaying, (playing) => {
  if (!audioRef.value) return
  if (playing) audioRef.value.play().catch(() => store.pause())
  else audioRef.value.pause()
})

watch(() => store.volume, (v) => { if (audioRef.value) audioRef.value.volume = v })

function onLoadedMetadata() { if (audioRef.value) store.setDuration(audioRef.value.duration) }
function onTimeUpdate() { 
  if (audioRef.value) {
    store.setCurrentTime(audioRef.value.currentTime)
    store.updateCurrentLyricLine(audioRef.value.currentTime)
  }
}
function onCanPlay() { store.setLoading(false); if (store.isPlaying) audioRef.value?.play() }
function onError() { store.setLoading(false); store.pause() }

onMounted(() => {
  store.loadFromStorage()
  if (audioRef.value) audioRef.value.volume = store.volume
  
  window.addEventListener('seek-audio', (e: Event) => {
    const customEvent = e as CustomEvent
    if (audioRef.value && customEvent.detail !== undefined) {
      audioRef.value.currentTime = customEvent.detail * audioRef.value.duration
    }
  })
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => store.play())
    navigator.mediaSession.setActionHandler('pause', () => store.pause())
    navigator.mediaSession.setActionHandler('previoustrack', () => store.playPrevious())
    navigator.mediaSession.setActionHandler('nexttrack', () => store.playNext())
  }
})

watch(() => store.currentSong, (song) => {
  if (song && 'mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.name,
      artist: song.artist,
      album: song.album,
      artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }]
    })
  }
})
</script>
