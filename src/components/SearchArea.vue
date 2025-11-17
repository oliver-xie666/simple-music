<template>
  <div 
    ref="searchAreaRef"
    id="searchArea"
    class="rounded-4 p-5 border relative z-20 overflow-visible flex flex-col transition-all duration-500 isolate"
    :class="[
      store.isDark ? 'bg-[#1e1e1e]/60 border-white/15' : 'bg-white/50 border-black/10',
      store.searchResults.length > 0 ? 'border-[#1abc9c] shadow-[0_15px_45px_rgba(26,188,156,0.2)]' : ''
    ]"
    style="grid-area: search; width: 100%;"
  >
    <div class="flex gap-2.5 items-center mb-3.75 flex-shrink-0">
      <input 
        type="text" 
        v-model="searchQuery" 
        @keyup.enter="handleSearch"
        class="flex-1 px-4 py-3 border-2 rounded-3 text-base outline-none transition-all duration-300 hover:border-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,188,156,0.25)] bg-white/50 text-[#2c3e50] border-black/10"
        :class="store.isDark ? 'bg-[#2a2a2a]/80 text-white border-white/20' : ''"
        placeholder="搜索歌曲、歌手或专辑..."
      >
      
      <!-- 音乐源选择 -->
      <div class="relative flex-shrink-0" data-source-selector>
        <button 
          @click="showMenu = !showMenu"
          class="flex items-center justify-between gap-2 px-4.5 py-3 border rounded-3 font-medium cursor-pointer transition-all duration-250 min-w-[150px] bg-white/50 text-[#2c3e50] border-black/10 hover:border-[#1abc9c] hover:text-[#1abc9c]"
          :class="store.isDark ? 'bg-[#2a2a2a]/80 text-white border-white/20 hover:border-[#1abc9c]' : ''"
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
          class="absolute top-[calc(100%+8px)] left-0 right-0 rounded-3 border min-w-full h-34 overflow-y-auto z-[100000] transition-all duration-180 shadow-[0_12px_30px_rgba(0,0,0,0.18)] bg-white border-black/10"
          :class="store.isDark ? 'bg-[#2a2a2a] border-white/20' : ''"
        >
          <div 
            v-for="source in sources" 
            :key="source.value"
            @click="selectSource(source.value)"
            class="flex items-center justify-between gap-3 px-4 py-2.5 text-0.95em cursor-pointer transition-all duration-200 text-[#2c3e50] hover:bg-[#1abc9c] hover:text-white"
            :class="store.isDark ? 'text-white' : ''"
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
        :class="store.isSearching ? 'bg-[#7f8c8d] cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]'"
      >
        <i :class="store.isSearching ? 'fas fa-spinner fa-spin' : 'fas fa-search'"></i>
        <span>搜索</span>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div 
      v-if="store.searchResults.length > 0" 
      class="absolute left-0 right-0 top-[calc(100%+12px)] z-[80]"
    >
      <div 
        class="px-5 pt-4 pb-5 rounded-4 border flex flex-col gap-4 transition-all duration-300 shadow-[0_20px_45px_rgba(0,0,0,0.25)]"
        :class="store.isDark ? 'bg-[#1e1e1e]/85 border-white/15' : 'bg-white/80 border-black/10'"
        style="backdrop-filter: blur(18px);"
      >
        <div class="flex flex-col gap-4">
      <!-- 工具栏：播放全部和导入已选 -->
      <div 
        class="flex flex-wrap gap-3 justify-between items-center pb-3 border-b"
        :class="store.isDark ? 'border-white/10' : 'border-black/10'"
      >
        <!-- 左侧：播放全部 -->
        <button
          @click="handlePlayAll"
          class="flex items-center gap-2 px-4 py-2 rounded-full border-none cursor-pointer transition-all duration-200 text-white bg-[#1abc9c] hover:bg-[#12836d] shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
        >
          <i class="fas fa-play text-0.9em"></i>
          <span class="text-0.9em font-semibold">播放全部</span>
        </button>

        <!-- 右侧：导入已选 -->
        <button
          @click="handleImportToPlaylist"
          :disabled="store.selectedSearchResults.size === 0"
          class="flex items-center gap-2 px-4 py-2 rounded-full border-none cursor-pointer transition-all duration-200 text-white shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
          :class="store.selectedSearchResults.size === 0 ? 'bg-[#7f8c8d]/50 cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]'"
        >
          <i class="fas fa-file-import text-0.9em"></i>
          <span class="text-0.9em font-semibold">导入已选</span>
          <span v-if="store.selectedSearchResults.size > 0" class="text-0.85em font-medium ml-1">
            ({{ store.selectedSearchResults.size }})
          </span>
        </button>

        <!-- 导入下拉菜单 - 已注释 -->
        <!-- <div class="relative">
          <button
            @click="showImportMenu = !showImportMenu"
            :disabled="store.selectedSearchResults.size === 0"
            class="flex items-center gap-2 px-4 py-2 rounded-full border-none cursor-pointer transition-all duration-200 text-white shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
            :class="store.selectedSearchResults.size === 0 ? 'bg-[#7f8c8d]/50 cursor-not-allowed' : 'bg-[#1abc9c] hover:bg-[#12836d]'"
          >
            <i class="fas fa-file-import text-0.9em"></i>
            <span class="text-0.9em font-semibold">导入已选</span>
            <span v-if="store.selectedSearchResults.size > 0" class="text-0.85em font-medium ml-1">
              ({{ store.selectedSearchResults.size }})
            </span>
            <i class="fas fa-caret-down text-0.75em ml-1"></i>
          </button>

          <div
            v-show="showImportMenu && store.selectedSearchResults.size > 0"
            class="absolute top-[calc(100%+8px)] right-0 rounded-2 border min-w-[160px] z-[20000] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            :class="store.isDark ? 'bg-[#2a2a2a] border-white/20' : 'bg-white border-black/10'"
          >
            <button
              @click="handleImportToPlaylist"
              class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
              :class="store.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
            >
              导入到播放列表
            </button>
            <button
              @click="handleImportToFavorites"
              class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
              :class="store.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
            >
              导入到收藏列表
            </button>
          </div>
        </div> -->
      </div>

      <!-- 搜索结果列表 -->
      <div 
        class="flex flex-col gap-2 py-3 pr-2 -mr-2 flex-1 min-h-0 overflow-y-auto max-h-[35vh]" 
        style="overscroll-behavior: contain;"
        @scroll.passive="handleResultsScroll"
      >
          <div 
            v-for="(song, index) in store.searchResults" 
            :key="index"
            @click="toggleSelection(index, $event)"
            class="flex items-center gap-3 px-4 py-3 rounded-3 cursor-pointer transition-all duration-300 border relative"
            :class="[
              store.isDark 
                ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                : 'bg-white/70 border-white/60 hover:bg-[#1abc9c]/10',
              store.selectedSearchResults.has(index) 
                ? store.isDark
                  ? 'border-[#34d1b6] bg-[#1abc9c]/15'
                  : 'border-[#1abc9c] bg-[#1abc9c]/12'
                : ''
            ]"
            :style="getSearchResultStyle(index)"
          >
            <!-- 左侧：圆形复选框 -->
            <button
              @click.stop="store.toggleSearchResultSelection(index)"
              class="w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-all duration-200"
              :class="[
                store.selectedSearchResults.has(index)
                  ? 'bg-[#1abc9c] border-[#1abc9c] text-white'
                  : store.isDark
                    ? 'border-white/30 bg-transparent'
                    : 'border-black/20 bg-transparent'
              ]"
              title="选择"
            >
              <i v-if="store.selectedSearchResults.has(index)" class="fas fa-check text-0.7em"></i>
            </button>

            <!-- 中间：歌曲信息 -->
            <div class="flex-1 min-w-0">
              <div 
                class="font-semibold text-[15px] mb-1 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200"
                :class="store.selectedSearchResults.has(index)
                  ? (store.isDark ? 'text-[#34d1b6]' : 'text-[#12836d]')
                  : (store.isDark ? 'text-white' : 'text-[#2c3e50]')"
              >
                {{ song.name }}
              </div>
              <div 
                class="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2 transition-colors duration-200"
                :class="store.selectedSearchResults.has(index)
                  ? (store.isDark ? 'text-[#9ff3e2]' : 'text-[#1abc9c]')
                  : (store.isDark ? 'text-white/70' : 'text-[#7f8c8d]')"
              >
                <span class="truncate">{{ formatArtist(song.artist) }}</span>
                <span 
                  class="flex-shrink-0"
                  :class="store.isDark ? 'text-white/30' : 'text-[#c0c8cc]'"
                >
                  -
                </span>
                <span class="truncate">{{ formatAlbum(song.album) }}</span>
              </div>
            </div>

            <!-- 右侧：操作按钮 -->
            <div class="flex gap-2 ml-3.75 flex-shrink-0">
              <!-- 播放按钮 -->
              <button 
                @click.stop="playSong(song)"
                class="px-3 py-1.5 rounded-2 border flex justify-center items-center gap-1.5 text-[13px] transition-all duration-200 text-white bg-[#1abc9c] border-[#1abc9c]/45 hover:bg-[#12836d] shadow-[0_6px_16px_rgba(26,188,156,0.3)]"
                title="播放"
              >
                <i class="fas fa-play text-0.85em"></i>
                <span>播放</span>
              </button>

              <!-- 下载按钮 -->
              <div>
                <button 
                  data-download-trigger
                  @click.stop="toggleDownloadMenu(index, $event)"
                  class="w-8 h-8 p-0 rounded-2 border flex justify-center items-center text-[14px] transition-all duration-200 text-white bg-[#2ecc71] border-[#2ecc71]/55 hover:bg-[#27ae60] shadow-[0_6px_16px_rgba(46,204,113,0.28)]"
                  title="下载"
                >
                  <i class="fas fa-download"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="showDownloadMenu !== null && activeDownloadSong"
          data-download-menu
          class="fixed rounded-2 border min-w-[170px] z-[200000] shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
          :class="store.isDark ? 'bg-[#2a2a2a] border-white/20' : 'bg-white border-black/10'"
          :style="{
            top: `${downloadMenuPosition.y}px`,
            left: `${downloadMenuPosition.x}px`
          }"
        >
          <button
            @click.stop="handleDownload(activeDownloadSong, '128')"
            class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
            :class="store.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
          >
            标准音质 (128k)
          </button>
          <button
            @click.stop="handleDownload(activeDownloadSong, '192')"
            class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
            :class="store.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
          >
            高音质 (192k)
          </button>
          <button
            @click.stop="handleDownload(activeDownloadSong, '320')"
            class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
            :class="store.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
          >
            超高音质 (320k)
          </button>
          <button
            @click.stop="handleDownload(activeDownloadSong, 'flac')"
            class="w-full px-4 py-2 text-left text-0.9em cursor-pointer transition-all duration-200 border-none bg-transparent"
            :class="store.isDark ? 'text-white hover:bg-white/10' : 'text-[#2c3e50] hover:bg-[#1abc9c]/10'"
          >
            无损音质 (FLAC)
          </button>
        </div>
      </Teleport>

      <!-- 分页 -->
        <div class="flex flex-col gap-3 pt-4 border-t"
          :class="store.isDark ? 'border-white/15' : 'border-black/10'"
        >
          <!-- 分页控制行 -->
          <div class="flex justify-end items-center gap-2">
            <button
              @click="handlePreviousPage"
              :disabled="store.searchPage <= 1 || store.isSearching"
              class="w-8 h-8 rounded-2 border cursor-pointer transition-all duration-200 flex items-center justify-center"
              :class="[
                store.searchPage <= 1 || store.isSearching
                  ? 'bg-[#7f8c8d]/30 cursor-not-allowed text-[#7f8c8d] border-[#7f8c8d]/30'
                  : store.isDark
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    : 'bg-white/50 text-[#2c3e50] border-black/10 hover:bg-[#1abc9c]/10 hover:border-[#1abc9c]'
              ]"
              title="上一页"
            >
              <i class="fas fa-chevron-left text-0.85em"></i>
            </button>

            <div class="flex items-center gap-2">
              <span class="text-0.9em px-2"
                :class="store.isDark ? 'text-white/80' : 'text-[#7f8c8d]'"
              >
                第
              </span>
              <input
                v-model.number="jumpPage"
                @keyup.enter="handleJumpToPage"
                type="number"
                min="1"
                class="w-16 px-2 py-1 text-center text-0.9em rounded-2 border outline-none transition-all duration-200"
                :class="[
                  store.isDark
                    ? 'bg-white/10 text-white border-white/20 focus:border-[#1abc9c]'
                    : 'bg-white/50 text-[#2c3e50] border-black/10 focus:border-[#1abc9c]'
                ]"
                placeholder="页码"
              />
              <span class="text-0.9em px-2"
                :class="store.isDark ? 'text-white/80' : 'text-[#7f8c8d]'"
              >
                页
              </span>
            </div>

            <button
              @click="handleNextPage"
              :disabled="store.isSearching || (store.searchResults.length < store.searchLimit && store.searchPage >= totalPages)"
              class="w-8 h-8 rounded-2 border cursor-pointer transition-all duration-200 flex items-center justify-center"
              :class="[
                store.isSearching || (store.searchResults.length < store.searchLimit && store.searchPage >= totalPages)
                  ? 'bg-[#7f8c8d]/30 cursor-not-allowed text-[#7f8c8d] border-[#7f8c8d]/30'
                  : store.isDark
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    : 'bg-white/50 text-[#2c3e50] border-black/10 hover:bg-[#1abc9c]/10 hover:border-[#1abc9c]'
              ]"
              title="下一页"
            >
              <i class="fas fa-chevron-right text-0.85em"></i>
            </button>

            <select
              :value="store.searchLimit"
              @change="handleLimitChange"
              class="px-3 py-1.5 rounded-2 border text-0.9em outline-none transition-all duration-200 cursor-pointer"
              :class="[
                store.isDark
                  ? 'bg-white/10 text-white border-white/20 hover:border-[#1abc9c]'
                  : 'bg-white/50 text-[#2c3e50] border-black/10 hover:border-[#1abc9c]'
              ]"
            >
              <option :value="20">20</option>
              <option :value="30">30</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../store'
import type { MusicSource } from '../types'
import { getSongUrl } from '../api'

const store = useAppStore()
const searchQuery = ref('')
const showMenu = ref(false)
// const showImportMenu = ref(false)
const showDownloadMenu = ref<number | null>(null)
const downloadMenuPosition = ref({ x: 0, y: 0 })
const jumpPage = ref(1)
const searchAreaRef = ref<HTMLElement | null>(null)

const activeDownloadSong = computed(() => {
  if (showDownloadMenu.value === null) return null
  return store.searchResults[showDownloadMenu.value] || null
})

const totalPages = computed(() => {
  // 如果当前页有数据且数量等于每页限制，说明可能还有更多页
  // 否则就是最后一页
  if (store.searchResults.length === store.searchLimit) {
    // 假设还有更多页，至少是当前页+1
    return Math.max(store.searchPage + 1, store.searchPage)
  }
  // 如果当前页数据少于每页限制，说明这是最后一页
  return store.searchPage
})

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
  if (store.isSearching) return
  if (!searchQuery.value.trim()) {
    store.showNotification('请输入搜索关键字', 'error')
    return
  }

  await store.search(searchQuery.value, 1, false)
}

function playSong(song: any) {
  store.addToPlaylist(song)
  const idx = store.playlist.findIndex(s => s.id === song.id && s.source === song.source)
  if (idx !== -1) store.playAtIndex(idx)
}

function handlePlayAll() {
  store.playAllSearchResults()
}

function toggleSelection(index: number, e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button')) {
    return
  }
  store.toggleSearchResultSelection(index)
}

function getSearchResultStyle(index: number) {
  const base: Record<string, string> = {
    backdropFilter: 'blur(12px)'
  }

  if (store.selectedSearchResults.has(index)) {
    base.borderWidth = '2px'
    base.borderColor = store.isDark ? '#34d1b6' : '#1abc9c'
    base.boxShadow = store.isDark
      ? '0 12px 32px rgba(26,188,156,0.35)'
      : '0 12px 30px rgba(26,188,156,0.25)'
  } else {
    base.boxShadow = store.isDark
      ? '0 6px 18px rgba(0,0,0,0.35)'
      : '0 6px 16px rgba(0,0,0,0.08)'
  }

  return base
}

function handleImportToPlaylist() {
  store.importSelectedSearchResults('playlist')
  // showImportMenu.value = false
}

// function handleImportToFavorites() {
//   store.importSelectedSearchResults('favorites')
//   showImportMenu.value = false
// }

async function handleDownload(song: any, quality: string) {
  closeDownloadMenu()
  
  try {
    store.showNotification('正在准备下载...', 'info')
    
    // 获取下载链接
    const response = await getSongUrl(song.id, song.source, quality)
    if (!response || !response.data || !response.data.url) {
      throw new Error('无法获取下载链接')
    }

    const downloadUrl = response.data.url
    
    // 在 Electron 环境中使用 IPC 下载
    if (window.electronAPI) {
      const filename = `${song.name} - ${song.artist}`
      const result = await window.electronAPI.downloadMusic({
        id: song.id,
        source: song.source,
        quality: quality === 'flac' ? '999' : quality,
        filename
      })
      
      if (result.success) {
        store.showNotification('下载成功', 'success')
      } else if (result.canceled) {
        // 用户取消了保存对话框
        return
      } else {
        throw new Error(result.error || '下载失败')
      }
    } else {
      // 浏览器环境：直接下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${song.name} - ${song.artist}.${quality === 'flac' ? 'flac' : 'mp3'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      store.showNotification('下载已开始', 'success')
    }
  } catch (error: any) {
    console.error('下载失败:', error)
    store.showNotification(error.message || '下载失败，请稍后重试', 'error')
  }
}

function formatArtist(artist: any): string {
  if (!artist) return '未知艺术家'
  if (typeof artist === 'string') return artist
  if (Array.isArray(artist)) {
    const names = artist.map(normalizeArtistName).filter(Boolean)
    return names.length ? names.join(' / ') : '未知艺术家'
  }
  if (typeof artist === 'object') {
    if (Array.isArray((artist as any).artists)) return formatArtist((artist as any).artists)
    if (Array.isArray((artist as any).ar)) return formatArtist((artist as any).ar)
    if (Array.isArray((artist as any).data)) return formatArtist((artist as any).data)
    if ('name' in artist && artist.name) return String(artist.name)
  }
  return String(artist)
}

function normalizeArtistName(entry: any): string {
  if (!entry) return ''
  if (typeof entry === 'string') return entry
  if (typeof entry === 'object') {
    return entry.name || entry.title || entry.artist || ''
  }
  return String(entry)
}

function formatAlbum(album: any): string {
  if (!album) return '未知专辑'
  if (typeof album === 'string') return album
  if (typeof album === 'object') {
    return album.name || album.title || album.album || '未知专辑'
  }
  return String(album)
}

function handlePreviousPage() {
  if (store.searchPage <= 1 || store.isSearching) return
  store.search(searchQuery.value, store.searchPage - 1, false)
}

function handleNextPage() {
  if (store.isSearching) return
  if (store.searchPage >= totalPages.value) return
  store.goToPage(store.searchPage + 1)
}

function handleJumpToPage() {
  const page = Number(jumpPage.value)
  if (page >= 1 && page <= totalPages.value) {
    store.goToPage(page)
    jumpPage.value = page
  } else {
    jumpPage.value = store.searchPage
    store.showNotification('页码超出范围', 'warning')
  }
}

function handleLimitChange(e: Event) {
  const limit = Number((e.target as HTMLSelectElement).value)
  store.setSearchLimit(limit)
}

function toggleDownloadMenu(index: number, event: MouseEvent) {
  if (showDownloadMenu.value === index) {
    closeDownloadMenu()
    return
  }

  const button = event.currentTarget as HTMLElement | null
  if (button) {
    const rect = button.getBoundingClientRect()
    const menuWidth = 180
    const padding = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : menuWidth + padding * 2
    const maxLeft = Math.max(padding, viewportWidth - menuWidth - padding)
    const clampedLeft = Math.min(Math.max(rect.left, padding), maxLeft)

    downloadMenuPosition.value = {
      x: clampedLeft,
      y: rect.bottom + 6
    }
  }

  showDownloadMenu.value = index
}

function closeDownloadMenu() {
  if (showDownloadMenu.value !== null) {
    showDownloadMenu.value = null
  }
}

function handleResultsScroll() {
  closeDownloadMenu()
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (showMenu.value && !target.closest('[data-source-selector]')) {
    showMenu.value = false
  }
  // if (showImportMenu.value && !target.closest('.relative')) {
  //   showImportMenu.value = false
  // }
  if (
    showDownloadMenu.value !== null &&
    !target.closest('[data-download-menu]') &&
    !target.closest('[data-download-trigger]')
  ) {
    closeDownloadMenu()
  }
  // 点击搜索区域外部时，清空搜索结果（关闭下拉框）
  if (searchAreaRef.value && !searchAreaRef.value.contains(target) && store.searchResults.length > 0) {
    store.searchResults = []
    store.selectedSearchResults.clear()
  }
}

// 同步jumpPage到当前页
watch(() => store.searchPage, (newPage) => {
  jumpPage.value = newPage
}, { immediate: true })

watch(() => store.searchResults.length, () => {
  closeDownloadMenu()
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  jumpPage.value = store.searchPage
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', closeDownloadMenu)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', closeDownloadMenu)
  }
})
</script>
