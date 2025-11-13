<template>
  <div 
    class="flex items-center gap-5 w-full transition-all duration-500"
    style="grid-area: controls; display: grid; grid-template-columns: 300px minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: 'transport progress trailing'; align-items: center; column-gap: 20px; row-gap: 12px;"
  >
    <!-- 左侧：播放控制 -->
    <div class="flex items-center gap-3 justify-self-start" style="grid-area: transport;">
      <!-- 播放模式 -->
      <button 
        @click="cyclePlayMode" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-12.5 h-12.5 flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        :title="playModeTitle"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
      >
        <i :class="playModeIcon"></i>
      </button>

      <!-- 上一曲 -->
      <button 
        @click="store.playPrevious" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-12.5 h-12.5 flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="store.playlist.length === 0"
      >
        <i class="fas fa-backward-step"></i>
      </button>

      <!-- 播放/暂停 -->
      <button 
        @click="togglePlay" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-15 h-15 flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.4em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="!store.currentSong && store.playlist.length === 0"
      >
        <i v-if="store.isLoading" class="fas fa-spinner fa-spin"></i>
        <i v-else :class="store.isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
      </button>

      <!-- 下一曲 -->
      <button 
        @click="store.playNext" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-12.5 h-12.5 flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="store.playlist.length === 0"
      >
        <i class="fas fa-forward-step"></i>
      </button>
    </div>

    <!-- 中间：进度条 -->
    <div class="flex items-center gap-3 min-w-[260px] w-full justify-self-stretch" style="grid-area: progress;">
      <span 
        class="text-0.85em" 
        :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
        style="font-variant-numeric: tabular-nums;"
      >
        {{ store.formattedCurrentTime }}
      </span>
      <input 
        type="range" 
        :value="store.currentTime" 
        @input="seekAudio"
        :max="store.duration || 0"
        step="0.1"
        class="flex-1 h-2 rounded-full cursor-pointer transition-all duration-200 appearance-none bg-transparent"
        :style="{
          background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${store.progress}%, rgba(255, 255, 255, 0.5) ${store.progress}%, rgba(255, 255, 255, 0.2) 100%)`
        }"
      />
      <span 
        class="text-0.85em" 
        :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
        style="font-variant-numeric: tabular-nums;"
      >
        {{ store.formattedDuration }}
      </span>
    </div>

    <!-- 右侧：音质、音量、探索雷达 -->
    <div class="flex items-center justify-between gap-5 w-full flex-wrap" style="grid-area: trailing;">
      <div class="flex items-center gap-4 flex-wrap justify-start flex-1">
        <!-- 音质选择 -->
        <div class="relative">
          <button 
            @click="showQualityMenu = !showQualityMenu"
            class="flex items-center justify-center gap-0 px-4 py-2.5 rounded-2 border font-medium cursor-pointer transition-all duration-200"
            :class="[
              showQualityMenu ? 'border-[#1abc9c] text-[#1abc9c]' : store.isDark ? 'text-[#ecf0f1] border-white/15' : 'text-[#2c3e50] border-black/10',
              store.isDark ? 'bg-[#2c2c2c]/50' : 'bg-white/50'
            ]"
            style="font-size: 0.9em; box-shadow: none;"
          >
            <span>{{ qualityText }}</span>
          </button>
          
          <div 
            v-show="showQualityMenu"
            class="absolute top-[calc(100%+10px)] right-0 rounded-3 border min-w-[180px] overflow-hidden z-[100000] transition-all duration-200"
            :class="store.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
            style="box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);"
          >
            <div 
              v-for="q in qualities"
              :key="q.value"
              @click="selectQuality(q.value)"
              class="flex justify-between items-center gap-2 px-3.5 py-2.5 text-0.9em cursor-pointer transition-all duration-200"
              :class="[
                store.quality === q.value 
                  ? 'bg-[#1abc9c] text-white' 
                  : store.isDark 
                    ? 'text-[#ecf0f1] hover:bg-[#1abc9c] hover:text-white' 
                    : 'text-[#2c3e50] hover:bg-[#1abc9c] hover:text-white'
              ]"
            >
              <span>{{ q.label }}</span>
            </div>
          </div>
        </div>

        <!-- 音量控制 -->
        <div class="flex items-center gap-2 min-w-[140px]">
          <i 
            :class="volumeIcon" 
            :style="{ color: store.isDark ? '#ecf0f1' : '#2c3e50' }"
            @click="toggleMute"
            class="cursor-pointer"
          ></i>
          <input 
            type="range" 
            :value="store.volume * 100" 
            @input="updateVolume"
            min="0" 
            max="100" 
            step="1"
            class="w-[110px] h-1.5 rounded-full cursor-pointer appearance-none bg-transparent"
            :style="{
              background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${store.volume * 100}%, rgba(255, 255, 255, 0.2) ${store.volume * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }"
          />
        </div>
      </div>

      <!-- 探索雷达 -->
      <button 
        @click="handleExploreRadar" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 px-6.25 gap-2.5 h-12.5 hover:bg-[#12836d]"
        :disabled="isExploring"
        :class="isExploring ? 'bg-[#7f8c8d] cursor-not-allowed' : ''"
        style="width: auto; font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
      >
        <i :class="isExploring ? 'fas fa-spinner fa-spin' : 'fas fa-satellite-dish'"></i>
        <span class="text-base">探索雷达</span>
      </button>
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
  { value: '128' as QualityType, label: '标准音质' },
  { value: '192' as QualityType, label: '较高音质' },
  { value: '320' as QualityType, label: '极高音质' },
  { value: 'flac' as QualityType, label: '无损音质' }
]

const qualityText = computed(() => 
  qualities.find(q => q.value === store.quality)?.label || '极高音质'
)

const playModeIcon = computed(() => {
  if (store.playMode === 'single-loop') return 'fas fa-repeat-1'
  if (store.playMode === 'shuffle') return 'fas fa-shuffle'
  return 'fas fa-repeat'
})

const playModeTitle = computed(() => {
  if (store.playMode === 'single-loop') return '单曲循环'
  if (store.playMode === 'shuffle') return '随机播放'
  return '列表循环'
})

const volumeIcon = computed(() => {
  if (store.volume === 0) return 'fas fa-volume-mute'
  if (store.volume < 0.5) return 'fas fa-volume-down'
  return 'fas fa-volume-up'
})

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

function seekAudio(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  window.dispatchEvent(new CustomEvent('seek-audio', { detail: value / (store.duration || 1) }))
}

function updateVolume(e: Event) {
  const value = parseInt((e.target as HTMLInputElement).value) / 100
  store.setVolume(value)
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
  if (isExploring.value) return
  isExploring.value = true
  try {
    const genres = ['流行', '摇滚', '民谣', '电子', '爵士', '说唱']
    const genre = genres[Math.floor(Math.random() * genres.length)]
    await store.search(genre)
    
    // 添加前10首到播放列表
    const songs = store.searchResults.slice(0, 10)
    songs.forEach(song => store.addToPlaylist(song))
    
    if (songs.length > 0 && !store.currentSong) {
      store.playAtIndex(0)
    }
  } finally {
    isExploring.value = false
  }
}
</script>

<style scoped>
/* Range Input 样式 */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1abc9c;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1abc9c;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  cursor: pointer;
}

input[type="range"]:active::-webkit-slider-thumb,
input[type="range"]:active::-moz-range-thumb {
  transform: scale(1.1);
}
</style>
