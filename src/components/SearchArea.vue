<template>
  <div 
    id="searchArea"
    class="rounded-4 p-5 border relative z-10 overflow-visible flex flex-col transition-all duration-500"
    style="grid-area: search; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);"
    :class="[
      store.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10'
    ]"
  >
    <div class="flex gap-2.5 items-center mb-3.75 flex-shrink-0">
      <input 
        type="text" 
        v-model="searchQuery" 
        @keyup.enter="handleSearch"
        class="flex-1 px-4 py-3 border-2 rounded-3 text-base outline-none transition-all duration-300"
        :class="[
          store.isDark ? 'bg-[#2c2c2c]/50 text-[#ecf0f1] border-white/15' : 'bg-white/50 text-[#2c3e50] border-black/10'
        ]"
        placeholder="搜索歌曲、歌手或专辑..."
      >
      
      <!-- 音乐源选择 -->
      <div class="relative flex-shrink-0">
        <button 
          @click="showMenu = !showMenu"
          class="flex items-center justify-between gap-2 px-4.5 py-3 border rounded-3 font-medium cursor-pointer transition-all duration-250 min-w-[150px]"
          :class="[
            showMenu ? 'border-[#1abc9c] text-[#1abc9c]' : '',
            store.isDark ? 'bg-[#2c2c2c]/50 text-[#ecf0f1] border-white/15' : 'bg-white/50 text-[#2c3e50] border-black/10'
          ]"
        >
          <span>{{ sourceName }}</span>
          <i 
            class="fas fa-chevron-down text-0.8em transition-transform duration-250"
            :style="{ transform: showMenu ? 'rotate(-180deg)' : '' }"
          ></i>
        </button>
        
        <!-- 下拉菜单 -->
        <div 
          v-show="showMenu"
          class="absolute top-[calc(100%+10px)] left-0 right-0 rounded-3 border min-w-full max-h-80 overflow-y-auto z-[100000] transition-all duration-180"
          :class="[
            store.isDark ? 'bg-[#2c2c2c]/95 border-white/15' : 'bg-white/95 border-black/10'
          ]"
          style="box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18); backdrop-filter: blur(12px);"
        >
          <div 
            v-for="source in sources" 
            :key="source.value"
            @click="selectSource(source.value)"
            class="flex items-center justify-between gap-3 px-4 py-3 text-0.95em cursor-pointer transition-all duration-200"
            :class="[
              store.searchSource === source.value 
                ? 'bg-[#1abc9c] text-white' 
                : store.isDark 
                  ? 'text-[#ecf0f1] hover:bg-[#1abc9c] hover:text-white' 
                  : 'text-[#2c3e50] hover:bg-[#1abc9c] hover:text-white'
            ]"
          >
            <span>{{ source.label }}</span>
            <i v-if="store.searchSource === source.value" class="fas fa-check text-0.85em"></i>
          </div>
        </div>
      </div>
      
      <button 
        @click="handleSearch" 
        class="text-white border-none rounded-3 px-5 py-3 cursor-pointer text-base transition-all duration-200 flex items-center gap-2"
        :disabled="store.isSearching || !searchQuery.trim()"
        :class="(store.isSearching || !searchQuery.trim()) ? 'bg-[#7f8c8d] cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]'"
      >
        <i :class="store.isSearching ? 'fas fa-spinner fa-spin' : 'fas fa-search'"></i>
        <span>搜索</span>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div 
      v-if="store.searchResults.length > 0" 
      class="flex-1 overflow-y-auto overflow-x-hidden border-t -mx-5 px-5 -mb-5 pt-3.75"
      :class="store.isDark ? 'border-white/15' : 'border-black/10'"
      style="border-radius: 0 0 14px 14px;"
    >
      <div class="flex flex-col gap-2">
        <div 
          v-for="(song, index) in store.searchResults" 
          :key="index"
          @click="playSong(song)"
          class="flex justify-between items-center px-4 py-3 rounded-3 cursor-pointer transition-all duration-300 mb-2 gap-3.5 border"
          :class="[
            store.isDark 
              ? 'bg-[#2c2c2c]/30 border-[#1abc9c]/20 hover:bg-[#1abc9c]/10' 
              : 'bg-white/30 border-white/20 hover:bg-[#1abc9c]/10'
          ]"
          style="backdrop-filter: blur(10px);"
        >
          <div class="flex-1 min-w-0">
            <div 
              class="font-semibold text-[15px] mb-1 whitespace-nowrap overflow-hidden text-ellipsis"
              :class="store.isDark ? 'text-[#ecf0f1]' : 'text-[#2c3e50]'"
            >
              {{ song.name }}
            </div>
            <div 
              class="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis"
              :class="store.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
            >
              {{ song.artist }}
            </div>
          </div>
          <div class="flex gap-2 ml-3.75">
            <button 
              @click.stop="playSong(song)"
              class="w-8 h-8 p-0 rounded-2 border border-[#1abc9c]/45 flex justify-center items-center text-[14px] transition-all duration-200 bg-[#1abc9c] text-white hover:bg-[#12836d]"
              style="box-shadow: 0 6px 16px rgba(26, 188, 156, 0.3);"
            >
              <i class="fas fa-play"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../store'
import type { MusicSource } from '../types'

const store = useAppStore()
const searchQuery = ref('')
const showMenu = ref(false)

const sources = [
  { value: 'netease' as MusicSource, label: '网易云音乐' },
  { value: 'kuwo' as MusicSource, label: '酷我音乐' },
  { value: 'joox' as MusicSource, label: 'JOOX音乐' }
]

const sourceName = computed(() => sources.find(s => s.value === store.searchSource)?.label || '网易云音乐')

function selectSource(source: MusicSource) {
  store.searchSource = source
  showMenu.value = false
}

async function handleSearch() {
  if (!searchQuery.value.trim() || store.isSearching) return
  showMenu.value = false
  await store.search(searchQuery.value)
}

function playSong(song: any) {
  store.addToPlaylist(song)
  const idx = store.playlist.findIndex(s => s.id === song.id && s.source === song.source)
  if (idx !== -1) store.playAtIndex(idx)
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (showMenu.value && !target.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
