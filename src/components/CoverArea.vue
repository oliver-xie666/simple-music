<template>
  <div 
    class="rounded-4 p-5 border flex flex-col items-center justify-center gap-4 text-center h-full overflow-hidden transition-all duration-500"
    style="grid-area: cover; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);"
    :class="[
      store.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10'
    ]"
  >
    <!-- 封面唱片 -->
    <div 
      class="w-[200px] h-[200px] min-h-[200px] flex-shrink-0 rounded-3 flex items-center justify-center mb-3.75 overflow-hidden relative"
      style="background: linear-gradient(45deg, #1abc9c, #2ecc71); box-shadow: 0 8px 20px rgba(0,0,0,0.15);"
      :style="{ animation: store.isPlaying ? 'spin 20s linear infinite' : 'none' }"
    >
      <img 
        v-if="store.currentSong?.cover" 
        :src="store.currentSong.cover" 
        alt="封面"
        class="w-full h-full object-cover rounded-3"
        :style="{ animation: store.isPlaying ? 'spin 20s linear infinite' : 'none' }"
        @error="handleImageError"
      />
      <div v-else class="text-[48px] text-white opacity-80">
        <i class="fas fa-music"></i>
      </div>
    </div>

    <!-- 歌曲信息 -->
    <div class="w-full">
      <div 
        class="text-base font-semibold mb-1.25 whitespace-nowrap overflow-hidden text-ellipsis"
        :class="store.isDark ? 'text-[#ecf0f1]' : 'text-[#2c3e50]'"
      >
        {{ store.currentSong?.name || '选择一首歌曲开始播放' }}
      </div>
      <div 
        class="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis"
        :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
      >
        {{ store.currentSong?.artist || '未知艺术家' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../store'

const store = useAppStore()

function handleImageError(e: Event) {
  console.error('封面加载失败')
}
</script>
