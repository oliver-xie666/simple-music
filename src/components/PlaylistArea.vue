<template>
  <div 
    class="rounded-4 p-5 border flex flex-col relative h-full min-h-[220px] overflow-hidden transition-all duration-500"
    style="grid-area: playlist; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); padding-top: 72px;"
    :class="[
      store.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10',
      store.playlist.length === 0 ? 'items-center justify-center' : 'items-stretch justify-start'
    ]"
  >
    <!-- 播放列表标题 -->
    <div class="absolute top-4 left-5 right-3 flex items-center justify-between gap-4 z-5"
      :class="store.isDark ? 'bg-[#2c2c2c]/50' : 'bg-white/50'"
      style="padding: 8px; border-radius: 12px; backdrop-filter: blur(10px);"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0 pointer-events-auto">
        <button 
          class="inline-flex items-center justify-center px-4 py-2 rounded-3 border bg-[#1abc9c] text-white text-[14px] font-medium cursor-pointer transition-all duration-200"
          :class="store.isDark ? 'border-white/15' : 'border-black/10'"
        >
          播放列表
        </button>
      </div>
      <div class="flex items-center gap-2 pointer-events-auto">
        <button class="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200" :class="store.isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'"><i class="fas fa-upload"></i></button>
        <button class="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200" :class="store.isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'"><i class="fas fa-download"></i></button>
        <button class="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200" :class="store.isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'"><i class="fas fa-trash"></i></button>
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-if="store.playlist.length === 0" 
      class="text-0.9em italic opacity-70"
      :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
    >
      点击"探索雷达"加载在线音乐
    </div>

    <!-- 播放列表内容 -->
    <div v-else class="flex-1 w-full overflow-y-auto pr-2 -mr-2" style="overscroll-behavior: contain;">
      <div class="w-full">
        <div 
          v-for="(song, index) in store.playlist" 
          :key="index"
          @click="store.playAtIndex(index)"
          class="px-3 py-2.5 rounded-2 transition-all duration-200 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis relative text-[14px] mb-0.5"
          :class="[
            store.currentIndex === index 
              ? 'text-[#1abc9c] font-medium bg-[#1abc9c]/20' 
              : store.isDark 
                ? 'text-[#ecf0f1] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]' 
                : 'text-[#2c3e50] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]'
          ]"
        >
          {{ song.name }} - {{ song.artist }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../store'

const store = useAppStore()
</script>
