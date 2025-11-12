<template>
  <div class="bg-white/50 dark:bg-gray-800/50 backdrop-blur border border-gray-300/30 dark:border-gray-600/30 rounded-2xl m-4 p-6 flex flex-col items-center justify-center" style="grid-area: cover;">
    <!-- 封面唱片 -->
    <div class="mb-6">
      <div 
        class="w-72 h-72 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/30 dark:ring-gray-700/30"
        :class="{ 'animate-spin-slow': store.isPlaying }"
      >
        <img 
          v-if="store.currentSong?.cover"
          :src="store.currentSong.cover"
          class="w-full h-full object-cover"
          @load="handleCoverLoad"
          @error="handleImageError"
        />
        <div 
          v-else
          class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
        >
          <i class="i-carbon-music text-9xl text-gray-400 dark:text-gray-600"></i>
        </div>
      </div>
    </div>

    <!-- 歌曲信息 -->
    <div class="w-full text-center">
      <div class="flex items-center justify-center gap-2 mb-2">
        <h2 class="text-2xl font-700 truncate max-w-sm">
          {{ store.currentSong?.name || '选择一首歌曲开始播放' }}
        </h2>
        <button 
          v-if="store.currentSong"
          @click="store.toggleFavorite(store.currentSong)"
          class="flex-none w-9 h-9 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition"
          :title="store.isFavorite(store.currentSong) ? '取消收藏' : '收藏'"
        >
          <i 
            :class="store.isFavorite(store.currentSong) ? 'i-carbon-favorite-filled text-red-500' : 'i-carbon-favorite text-gray-500'"
            class="text-lg"
          ></i>
        </button>
      </div>
      <div class="text-base text-gray-600 dark:text-gray-400">
        {{ store.currentSong?.artist || '未知艺术家' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../store'

const store = useAppStore()

function handleCoverLoad() {
  if (store.currentSong?.cover) {
    store.extractColors(store.currentSong.cover)
  }
}

function handleImageError(e: Event) {
  console.error('封面加载失败')
}
</script>

