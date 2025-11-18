<template>
  <div 
    class="rounded-4 p-5 border flex flex-col items-center justify-center gap-4 text-center h-full overflow-hidden transition-all duration-500"
    style="grid-area: cover; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);"
    :class="[
      themeStore.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10'
    ]"
  >
    <!-- 封面唱片 -->
    <div 
      class="w-full max-w-[260px] aspect-square flex-shrink-0 rounded-3 flex items-center justify-center mb-5 overflow-hidden relative"
      style="background: linear-gradient(45deg, #1abc9c, #2ecc71); box-shadow: 0 8px 20px rgba(0,0,0,0.15);"
      :class="!playerStore.currentSong ? 'animate-pulse' : ''"
    >
      <img 
        v-if="playerStore.currentSong?.cover" 
        :src="playerStore.currentSong.cover" 
        alt="封面"
        class="w-full h-full object-cover rounded-3"
        @error="handleImageError"
      />
      <div 
        v-else 
        class="text-[48px] text-white opacity-80 flex items-center justify-center w-full h-full"
      >
        <i class="fas fa-music"></i>
      </div>
    </div>

    

    <!-- 歌曲信息 -->
    <div class="w-full mt-2">
      <div 
        class="text-base font-semibold mb-1.25 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300"
        :class="themeStore.isDark ? 'text-[#ecf0f1]' : 'text-[#2c3e50]'"
      >
        {{ playerStore.currentSong?.name || '选择一首歌曲开始播放' }}
      </div>
      <div 
        class="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300"
        :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
      >
        {{ artistText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'
import { normalizeArtistField } from '../utils/song-utils'

const playerStore = usePlayerStore()
const themeStore = useThemeStore()

function handleImageError() {
  // 如果封面加载失败，清空 cover，触发占位图显示，避免反复报错
  if (playerStore.currentSong && typeof playerStore.currentSong === 'object') {
    ;(playerStore.currentSong as any).cover = ''
  }
}

const artistText = computed(() => normalizeArtistField(playerStore.currentSong?.artist))
</script>
