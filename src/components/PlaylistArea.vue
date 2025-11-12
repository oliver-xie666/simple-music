<template>
  <div class="bg-white/50 dark:bg-gray-800/50 backdrop-blur border border-gray-300/30 dark:border-gray-600/30 rounded-2xl m-4 overflow-hidden flex flex-col" style="grid-area: playlist;">
    <!-- Tab 切换 -->
    <div class="flex border-b border-gray-300/30 dark:border-gray-600/30">
      <button 
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        class="flex-1 px-6 py-4 font-600 text-sm transition relative"
        :class="activeTab === tab.value ? 'text-teal-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        {{ tab.label }} ({{ tab.count }})
        <div v-if="activeTab === tab.value" class="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"></div>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-4 min-h-0">
      <!-- 播放列表 -->
      <div v-if="activeTab === 'playlist'">
        <div v-if="store.playlist.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
          <i class="i-carbon-music text-6xl mb-4"></i>
          <p class="text-sm">播放列表为空</p>
        </div>
        <div v-else class="flex flex-col gap-2">
          <div 
            v-for="(song, i) in store.playlist"
            :key="`${song.id}-${i}`"
            @dblclick="store.playAtIndex(i)"
            class="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer group transition"
            :class="i === store.currentIndex ? 'bg-teal-100 dark:bg-teal-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/30'"
          >
            <div class="w-7 text-center text-xs font-600" :class="i === store.currentIndex ? 'text-teal-500' : 'text-gray-500'">{{ i + 1 }}</div>
            <img :src="song.cover || placeholderImage" class="w-11 h-11 rounded object-cover" @error="(e: any) => e.target.src = placeholderImage" />
            <div class="flex-1 min-w-0">
              <div class="font-500 truncate text-sm" :class="i === store.currentIndex ? 'text-teal-600 dark:text-teal-400' : ''">{{ song.name }}</div>
              <div class="text-xs text-gray-500 truncate">{{ song.artist }}</div>
            </div>
            <button @click.stop="store.removeFromPlaylist(i)" class="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" title="移除"><i class="i-carbon-close text-red-500"></i></button>
          </div>
        </div>
      </div>

      <!-- 收藏列表 -->
      <div v-else-if="activeTab === 'favorites'">
        <div v-if="store.favorites.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
          <i class="i-carbon-favorite text-6xl mb-4"></i>
          <p class="text-sm">收藏列表为空</p>
        </div>
        <div v-else class="flex flex-col gap-2">
          <div 
            v-for="song in store.favorites"
            :key="song.id"
            @dblclick="playSong(song)"
            class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/30 cursor-pointer group transition"
          >
            <img :src="song.cover || placeholderImage" class="w-11 h-11 rounded object-cover" @error="(e: any) => e.target.src = placeholderImage" />
            <div class="flex-1 min-w-0">
              <div class="font-500 truncate text-sm">{{ song.name }}</div>
              <div class="text-xs text-gray-500 truncate">{{ song.artist }}</div>
            </div>
            <button @click.stop="store.toggleFavorite(song)" class="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" title="取消收藏"><i class="i-carbon-close text-red-500"></i></button>
          </div>
        </div>
      </div>

      <!-- 歌词面板 -->
      <div v-else class="h-full">
        <div v-if="store.lyrics.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
          <i class="i-carbon-text-align-left text-6xl mb-4"></i>
          <p class="text-sm">暂无歌词</p>
        </div>
        <div v-else class="flex flex-col gap-3">
          <div 
            v-for="(line, i) in store.lyrics"
            :key="i"
            class="text-center py-2 px-3 rounded-lg transition"
            :class="i === store.currentLyricLine ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-600 text-lg' : 'text-gray-600 dark:text-gray-400 text-sm'"
          >
            {{ line.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import type { Song } from '../types'

const store = useAppStore()
const activeTab = ref<'playlist' | 'favorites' | 'lyrics'>('playlist')
const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E'

const tabs = computed(() => [
  { value: 'playlist' as const, label: '播放列表', count: store.playlist.length },
  { value: 'favorites' as const, label: '收藏列表', count: store.favorites.length },
  { value: 'lyrics' as const, label: '歌词', count: store.lyrics.length }
])

function playSong(song: Song) {
  store.addToPlaylist(song)
  const idx = store.playlist.findIndex(s => s.id === song.id && s.source === song.source)
  if (idx !== -1) store.playAtIndex(idx)
}
</script>

