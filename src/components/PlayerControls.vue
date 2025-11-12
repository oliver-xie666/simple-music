<template>
  <div class="px-8 py-5 flex flex-col gap-4" style="grid-area: controls;">
    <!-- 进度条 -->
    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-500 dark:text-gray-400 w-12 text-right font-mono">{{ store.formattedCurrentTime }}</span>
      <div 
        class="flex-1 h-10 flex items-center cursor-pointer group"
        @click="handleProgressClick"
      >
        <div class="w-full h-2 bg-gray-300/50 dark:bg-gray-600/50 rounded-full relative overflow-hidden">
          <div 
            class="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-150"
            :style="{ width: `${store.progress}%` }"
          ></div>
          <div 
            class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
            :style="{ left: `calc(${store.progress}% - 8px)` }"
          ></div>
        </div>
      </div>
      <span class="text-sm text-gray-500 dark:text-gray-400 w-12 text-left font-mono">{{ store.formattedDuration }}</span>
    </div>

    <!-- 控制按钮 + 工具栏 -->
    <div class="flex items-center justify-between">
      <!-- 左侧：播放模式 + 上一曲 -->
      <div class="flex items-center gap-2">
        <button 
          @click="cyclePlayMode"
          class="w-11 h-11 rounded-lg bg-transparent hover:bg-teal-100 dark:hover:bg-gray-700 flex items-center justify-center transition"
          :title="playModeText"
        >
          <i v-if="store.playMode === 'list-loop'" class="i-carbon-repeat text-xl"></i>
          <i v-else-if="store.playMode === 'single-loop'" class="i-carbon-repeat-one text-xl"></i>
          <i v-else class="i-carbon-shuffle text-xl"></i>
        </button>
        <button 
          @click="store.playPrevious()"
          class="w-11 h-11 rounded-lg bg-transparent hover:bg-teal-100 dark:hover:bg-gray-700 flex items-center justify-center transition"
          :disabled="store.playlist.length === 0"
        >
          <i class="i-carbon-skip-back text-xl"></i>
        </button>
      </div>

      <!-- 中间：播放/暂停按钮 -->
      <button 
        @click="togglePlay"
        class="w-16 h-16 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white flex items-center justify-center transition-all shadow-xl hover:scale-105 hover:shadow-2xl"
        :disabled="!store.currentSong && store.playlist.length === 0"
      >
        <i v-if="store.isLoading" class="i-carbon-circle-dash animate-spin text-3xl"></i>
        <i v-else-if="store.isPlaying" class="i-carbon-pause-filled text-3xl"></i>
        <i v-else class="i-carbon-play-filled text-3xl ml-1"></i>
      </button>

      <!-- 右侧：下一曲 + 随机播放 -->
      <div class="flex items-center gap-2">
        <button 
          @click="store.playNext()"
          class="w-11 h-11 rounded-lg bg-transparent hover:bg-teal-100 dark:hover:bg-gray-700 flex items-center justify-center transition"
          :disabled="store.playlist.length === 0"
        >
          <i class="i-carbon-skip-forward text-xl"></i>
        </button>
        <button 
          @click="handleExploreRadar"
          :disabled="isExploring"
          class="w-11 h-11 rounded-lg bg-transparent hover:bg-teal-100 dark:hover:bg-gray-700 flex items-center justify-center transition"
          title="探索雷达"
        >
          <i 
            :class="isExploring ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-satellite'"
            class="text-xl"
          ></i>
        </button>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-300/30 dark:border-gray-600/30">
      <!-- 音质选择 -->
      <div class="relative">
        <button 
          @click="showQualityMenu = !showQualityMenu"
          class="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700/50 transition flex items-center gap-1.5"
        >
          <span class="font-500">{{ qualityText }}</span>
          <i class="i-carbon-chevron-down text-xs"></i>
        </button>
        <div 
          v-if="showQualityMenu"
          class="absolute bottom-full left-0 mb-2 w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-teal-400/30 py-1 z-50"
        >
          <button
            v-for="q in qualities"
            :key="q.value"
            @click="selectQuality(q.value)"
            class="w-full px-3 py-2 text-left text-sm hover:bg-teal-50 dark:hover:bg-gray-700 transition"
            :class="{ 'bg-teal-50 dark:bg-gray-700 text-teal-600 dark:text-teal-400 font-500': store.quality === q.value }"
          >
            {{ q.label }}
          </button>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="flex items-center gap-2">
        <button 
          @click="toggleMute"
          class="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-center transition"
        >
          <i v-if="store.volume === 0" class="i-carbon-volume-mute text-lg"></i>
          <i v-else-if="store.volume < 0.5" class="i-carbon-volume-down text-lg"></i>
          <i v-else class="i-carbon-volume-up text-lg"></i>
        </button>
        <input 
          type="range"
          class="w-28 h-2 bg-gray-300/50 dark:bg-gray-600/50 rounded-full appearance-none cursor-pointer"
          style="accent-color: #14b8a6"
          min="0"
          max="100"
          :value="store.volume * 100"
          @input="handleVolumeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import type { QualityType, PlayMode } from '../types'

const store = useAppStore()
const showQualityMenu = ref(false)
const isExploring = ref(false)
const lastVolume = ref(0.8)

const qualities = [
  { value: '128' as QualityType, label: '标准音质 (128k)' },
  { value: '192' as QualityType, label: '较高音质 (192k)' },
  { value: '320' as QualityType, label: '极高音质 (320k)' },
  { value: 'flac' as QualityType, label: '无损音质 (FLAC)' }
]

const qualityText = computed(() => 
  qualities.find(q => q.value === store.quality)?.label.split(' ')[0] || '极高音质'
)

const playModeText = computed(() => ({
  'list-loop': '列表循环',
  'single-loop': '单曲循环',
  'shuffle': '随机播放'
}[store.playMode]))

function togglePlay() {
  if (!store.currentSong && store.playlist.length > 0) {
    store.playAtIndex(0)
    return
  }
  store.togglePlay()
}

function cyclePlayMode() {
  const modes: PlayMode[] = ['list-loop', 'single-loop', 'shuffle']
  const idx = modes.indexOf(store.playMode)
  store.setPlayMode(modes[(idx + 1) % modes.length])
  store.saveToStorage()
}

function handleProgressClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  // 通过自定义事件通知 App.vue
  window.dispatchEvent(new CustomEvent('seek-audio', { detail: percent }))
}

function handleVolumeChange(e: Event) {
  store.setVolume(parseInt((e.target as HTMLInputElement).value) / 100)
  store.saveToStorage()
}

function toggleMute() {
  if (store.volume > 0) {
    lastVolume.value = store.volume
    store.setVolume(0)
  } else {
    store.setVolume(lastVolume.value)
  }
}

function selectQuality(q: QualityType) {
  store.setQuality(q)
  showQualityMenu.value = false
  store.saveToStorage()
}

async function handleExploreRadar() {
  isExploring.value = true
  try {
    const genres = ['流行', '摇滚', '民谣', '电子', '爵士', '说唱']
    const genre = genres[Math.floor(Math.random() * genres.length)]
    await store.search(genre)
    
    // 添加前10首到播放列表
    const songs = store.searchResults.slice(0, 10)
    songs.forEach(song => store.addToPlaylist(song))
  } finally {
    isExploring.value = false
  }
}
</script>

