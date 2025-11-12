<template>
  <div class="px-8 py-4" style="grid-area: search;">
    <!-- 搜索输入框 -->
    <div class="flex gap-3 mb-4">
      <input 
        v-model="searchQuery"
        @keyup.enter="handleSearch"
        type="text"
        class="flex-1 px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur border border-gray-300/50 dark:border-gray-600/50 outline-none focus:border-teal-400 transition text-base"
        placeholder="搜索歌曲、歌手或专辑..."
      />
      <div class="relative">
        <button 
          @click="showMenu = !showMenu"
          class="px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur border border-gray-300/50 dark:border-gray-600/50 hover:border-teal-400 transition flex items-center gap-2 min-w-36"
        >
          <span class="text-sm font-500">{{ sourceName }}</span>
          <i class="i-carbon-chevron-down text-sm"></i>
        </button>
        <div 
          v-if="showMenu"
          class="absolute top-full right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-teal-400/30 py-2 z-50"
        >
          <button
            v-for="source in sources"
            :key="source.value"
            @click="selectSource(source.value)"
            class="w-full px-4 py-2.5 text-left text-sm hover:bg-teal-500 hover:text-white transition"
            :class="{ 'bg-teal-500 text-white': store.searchSource === source.value }"
          >
            {{ source.label }}
          </button>
        </div>
      </div>
      <button 
        @click="handleSearch"
        :disabled="store.isSearching || !searchQuery.trim()"
        class="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white font-600 flex items-center gap-2 shadow-lg transition"
      >
        <i :class="store.isSearching ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-search'"></i>
        <span>搜索</span>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div 
      v-if="store.searchResults.length > 0"
      class="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-4 max-h-60 overflow-y-auto border border-gray-300/30 dark:border-gray-600/30"
    >
      <div class="flex justify-between items-center mb-3">
        <span class="text-sm font-600">搜索结果 ({{ store.searchResults.length }})</span>
        <button 
          @click="store.searchResults = []"
          class="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition"
        >
          <i class="i-carbon-close"></i>
        </button>
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="song in store.searchResults"
          :key="song.id"
          @dblclick="playSong(song)"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer group transition"
        >
          <img :src="song.cover || placeholderImage" class="w-12 h-12 rounded object-cover" @error="(e: any) => e.target.src = placeholderImage" />
          <div class="flex-1 min-w-0">
            <div class="font-500 truncate text-sm">{{ song.name }}</div>
            <div class="text-xs text-gray-500 truncate">{{ song.artist }}</div>
          </div>
          <button @click.stop="store.addToPlaylist(song)" class="w-9 h-9 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" title="添加"><i class="i-carbon-add text-lg"></i></button>
          <button @click.stop="store.toggleFavorite(song)" class="w-9 h-9 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" title="收藏"><i :class="store.isFavorite(song) ? 'i-carbon-favorite-filled text-red-500' : 'i-carbon-favorite'" class="text-lg"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import type { Song, MusicSource } from '../types'

const store = useAppStore()
const searchQuery = ref('')
const showMenu = ref(false)
const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E'

const sources = [
  { value: 'netease' as MusicSource, label: '网易云音乐' },
  { value: 'qq' as MusicSource, label: 'QQ音乐' },
  { value: 'kugou' as MusicSource, label: '酷狗音乐' },
  { value: 'kuwo' as MusicSource, label: '酷我音乐' }
]

const sourceName = computed(() => sources.find(s => s.value === store.searchSource)?.label || '网易云音乐')

function selectSource(source: MusicSource) {
  store.searchSource = source
  showMenu.value = false
}

async function handleSearch() {
  if (!searchQuery.value.trim()) return
  showMenu.value = false
  await store.search(searchQuery.value)
}

function playSong(song: Song) {
  store.addToPlaylist(song)
  const idx = store.playlist.findIndex(s => s.id === song.id && s.source === song.source)
  if (idx !== -1) store.playAtIndex(idx)
}
</script>

