<template>
  <div 
    class="grid w-full items-center transition-all duration-500 gap-x-5 gap-y-3 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
    style="grid-area: controls;"
  >
    <!-- 左侧：播放控制 -->
    <div class="flex items-center gap-3 justify-center md:justify-self-start md:justify-start">
      <!-- 播放模式 -->
      <button 
        @click="cyclePlayMode" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        :title="playModeTitle"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
      >
        <i :class="playModeIcon"></i>
      </button>

      <!-- 上一曲 -->
      <button 
        @click="store.playPrevious" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="store.playlist.length === 0"
      >
        <i class="fas fa-backward-step"></i>
      </button>

      <!-- 播放/暂停 -->
      <button 
        @click="togglePlay" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.4em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="!store.currentSong && store.playlist.length === 0"
      >
        <i v-if="store.isLoading" class="fas fa-spinner fa-spin" style="margin: 0;"></i>
        <i v-else :class="store.isPlaying ? 'fas fa-pause' : 'fas fa-play'" :style="{ marginLeft: store.isPlaying ? '0' : '2px' }"></i>
      </button>

      <!-- 下一曲 -->
      <button 
        @click="store.playNext" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] flex justify-center items-center transition-all duration-200 hover:bg-[#12836d]"
        style="font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        :disabled="store.playlist.length === 0"
      >
        <i class="fas fa-forward-step"></i>
      </button>
    </div>

    <!-- 中间：进度条 -->
    <div class="flex items-center gap-3 min-w-0 w-full md:justify-self-stretch">
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
        class="flex-1 h-2 rounded-full cursor-pointer transition-all duration-200"
        :style="{
          background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${store.progress}%, rgba(255, 255, 255, 0.3) ${store.progress}%, rgba(255, 255, 255, 0.15) 100%)`
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
    <div class="flex items-center justify-between gap-5 w-full flex-wrap md:flex-nowrap">
      <div class="flex items-center gap-4 justify-start flex-1 min-w-0 flex-wrap md:flex-nowrap">
        <!-- 音质选择 -->
        <div class="relative flex-shrink-0">
          <button 
            @click="showQualityMenu = !showQualityMenu"
            class="flex items-center justify-center gap-0 px-4 py-2.5 rounded-2 border font-medium cursor-pointer transition-all duration-200"
            :title="'音质: ' + qualityText"
            :class="[
              showQualityMenu ? 'border-[#1abc9c] text-[#1abc9c]' : store.isDark ? 'text-[#ecf0f1] border-white/15 hover:border-[#1abc9c] hover:text-[#1abc9c]' : 'text-[#2c3e50] border-black/10 hover:border-[#1abc9c] hover:text-[#1abc9c]',
              store.isDark ? 'bg-[#2c2c2c]/50' : 'bg-white/50'
            ]"
            style="font-size: 0.9em; box-shadow: none;"
          >
            <span>{{ qualityText }}</span>
          </button>
          
          <div 
            v-show="showQualityMenu"
            class="absolute bottom-[calc(100%+10px)] right-0 rounded-3 border min-w-[180px] overflow-hidden z-[100000] transition-all duration-200 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
            :class="store.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
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
              <span>{{ q.label }} <span class="opacity-70">({{ q.description }})</span></span>
            </div>
          </div>
        </div>

        <!-- 音量控制 -->
        <div class="flex items-center gap-2 min-w-0">
          <i 
            :class="volumeIcon" 
            :style="{ color: store.isDark ? '#ecf0f1' : '#2c3e50' }"
            @click="toggleMute"
            class="cursor-pointer text-lg"
          ></i>
          <input 
            type="range" 
            :value="store.volume * 100" 
            @input="updateVolume"
            min="0" 
            max="100" 
            step="1"
            class="w-[90px] sm:w-[110px] h-1.5 rounded-full cursor-pointer"
            :style="{
              background: `linear-gradient(to right, #1abc9c 0%, #1abc9c ${store.volume * 100}%, rgba(255, 255, 255, 0.3) ${store.volume * 100}%, rgba(255, 255, 255, 0.15) 100%)`
            }"
          />
        </div>
      </div>

    </div>

    <!-- 独立：探索雷达 -->
    <div class="flex items-center w-full md:w-auto">
      <button 
        @click="handleExploreRadar" 
        class="bg-[#1abc9c] text-white border-none rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 px-3 sm:px-4 md:px-6.25 gap-2.5 h-9 sm:h-10 md:h-12.5 hover:bg-[#12836d] shrink-0 text-sm md:text-base"
        :disabled="isExploring"
        :class="isExploring ? 'bg-[#7f8c8d] cursor-not-allowed' : ''"
        style="width: auto; font-size: 1.2em; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
      >
        <i :class="isExploring ? 'fas fa-spinner fa-spin' : 'fas fa-satellite-dish'"></i>
        <span class="hidden sm:inline md:text-base">探索雷达</span>
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
  { value: '128' as QualityType, label: '标准音质', description: '128kbps' },
  { value: '192' as QualityType, label: '较高音质', description: '192kbps' },
  { value: '320' as QualityType, label: '极高音质', description: '320kbps' },
  { value: 'flac' as QualityType, label: '无损音质', description: 'FLAC' }
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
  const picked = qualities.find(x => x.value === q)
  if (picked) {
    store.showNotification(`音质已切换为 ${picked.label} (${picked.description})`, 'success')
  }
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
