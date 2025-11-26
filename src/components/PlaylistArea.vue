<template>
  <div 
    class="rounded-4 p-5 border flex flex-col relative h-full min-h-[220px] overflow-hidden transition-all duration-500"
    style="grid-area: playlist; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); padding-top: 72px;"
    :class="[
      themeStore.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10',
      playlistStore.songs.length === 0 ? 'items-center justify-center' : 'items-stretch justify-start'
    ]"
  >
    <!-- 播放列表标题 / 操作区 -->
    <div
      class="absolute top-4 left-5 right-3 flex items-center justify-between gap-4 z-5 pointer-events-none"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0 pointer-events-auto">
        <div
          class="inline-flex items-center justify-center px-0 py-0 text-[15px] font-semibold tracking-wide"
          :class="themeStore.isDark ? 'text-white' : 'text-[#2c3e50]'"
        >
          播放列表
        </div>
      </div>
      <div class="flex items-center gap-2 pointer-events-auto">
        <!-- 下载全部 -->
        <button
          ref="downloadAllButtonRef"
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white/80 shadow-[0_8px_18px_rgba(46,204,113,0.2)]"
          :class="themeStore.isDark ? 'bg-[#181e28]/85 border-[#2ecc71]/40 text-[#2ecc71] hover:text-[#27ae60]' : 'border-[#2ecc71]/35 text-[#2ecc71] hover:text-[#27ae60]'"
          type="button"
          title="下载全部"
          @click="handleDownloadAll"
          :disabled="playlistStore.songs.length === 0 || isDownloadingAll"
        >
          <i 
            v-if="isDownloadingAll"
            class="fas fa-spinner fa-spin text-[14px]"
          ></i>
          <i 
            v-else
            class="fas fa-download text-[14px]"
          ></i>
        </button>

        <!-- 导入播放列表 -->
        <input
          ref="importInputRef"
          type="file"
          accept="application/json"
          class="hidden"
          @change="handleImportChange"
        >
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white/80 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
          :class="themeStore.isDark ? 'bg-[#181e28]/85 border-white/20 text-[#bdc3c7] hover:text-[#1abc9c]' : 'border-black/5 text-[#7f8c8d] hover:text-[#1abc9c]'"
          type="button"
          title="导入播放列表"
          @click="triggerImport"
        >
          <i class="fas fa-file-import text-[14px]"></i>
        </button>

        <!-- 导出播放列表 -->
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white/80 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
          :class="themeStore.isDark ? 'bg-[#181e28]/85 border-white/20 text-[#bdc3c7] hover:text-[#16a085]' : 'border-black/5 text-[#7f8c8d] hover:text-[#16a085]'"
          type="button"
          title="导出播放列表"
          @click="handleExport"
          :disabled="playlistStore.songs.length === 0"
        >
          <i class="fas fa-file-export text-[14px]"></i>
        </button>

        <!-- 清空播放列表 -->
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white/80 shadow-[0_8px_18px_rgba(231,76,60,0.2)]"
          :class="themeStore.isDark ? 'bg-[#181e28]/85 border-[#e74c3c]/40 text-[#e74c3c] hover:text-[#ff6b5a]' : 'border-[#e74c3c]/35 text-[#e74c3c] hover:text-[#ff6b5a]'"
          type="button"
          title="清空播放列表"
          @click="handleClear"
          :disabled="playlistStore.songs.length === 0"
        >
          <i class="fas fa-trash text-[14px]"></i>
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-if="playlistStore.songs.length === 0" 
      class="text-0.9em italic opacity-70"
      :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
    >
      点击"探索雷达"加载在线音乐
    </div>

    <!-- 播放列表内容 -->
    <div
      v-else
      ref="listRef"
      class="flex-1 w-full overflow-y-auto pr-2 -mr-2"
      style="overscroll-behavior: contain;"
      @scroll="handleListScroll"
    >
      <div class="w-full">
        <div 
          v-for="(song, index) in playlistStore.songs" 
          :key="index"
          @click="playAtIndex(index)"
          class="group playlist-row cursor-pointer"
          :ref="(el) => setSongRef(el as unknown as Element | null, index)"
          :title="formatSongTitle(song)"
          :class="[
            playlistStore.currentIndex === index 
              ? 'text-[#1abc9c] font-medium bg-[#1abc9c]/20' 
              : themeStore.isDark 
                ? 'text-[#ecf0f1] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]' 
                : 'text-[#2c3e50] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]'
          ]"
        >
          <span class="inline-block max-w-full truncate align-middle">
            {{ song.name }} - {{ normalizeArtistField(song.artist) }}
          </span>

          <!-- 下载 / 删除按钮：hover 时显示，样式和动效-->
          <button
            class="playlist-item-download"
            type="button"
            title="下载这首歌"
            data-download-trigger
            @click.stop="toggleDownloadMenu(index, $event)"
          >
            <i class="fas fa-download"></i>
          </button>

          <button
            class="playlist-item-remove"
            type="button"
            title="从播放列表移除"
            @click.stop="handleRemove(index)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 下载音质选择菜单（与搜索结果保持一致） -->
    <Teleport to="body">
      <div
        v-if="showDownloadMenu !== null && activeDownloadSong"
        data-download-menu
        class="fixed rounded-3 border min-w-[190px] max-w-[70vw] p-2 z-[200000] shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
        :class="themeStore.isDark ? 'bg-[#1c1c1c] border-white/15' : 'bg-white border-black/10'"
        :style="{
          top: `${downloadMenuPosition.y}px`,
          left: `${downloadMenuPosition.x}px`
        }"
      >
        <QualityMenuList
          :options="qualityOptions"
          @select="value => handleDownload(activeDownloadSong, value)"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUpdate, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlaylistStore } from '../stores/playlist'
import { useThemeStore } from '../stores/theme'
import { usePlayerStore } from '../stores/player'
import { usePlayer } from '../composables/usePlayer'
import { useNotification } from '../composables/useNotification'
import { useDownload } from '../composables/useDownload'
import { normalizeArtistField } from '../utils/song-utils'
import { QUALITY_OPTIONS } from '../utils/quality-options'
import QualityMenuList from './QualityMenuList.vue'

const playlistStore = usePlaylistStore()
const themeStore = useThemeStore()
const { playAtIndex } = usePlayer()
const { show: showNotification } = useNotification()
const { downloadSong, downloadSongs } = useDownload()
const listRef = ref<HTMLDivElement | null>(null)
const songRefs = ref<(HTMLDivElement | null)[]>([])
const importInputRef = ref<HTMLInputElement | null>(null)
const showDownloadMenu = ref<number | null>(null)
const activeDownloadSong = ref<any | null>(null)
const downloadMenuPosition = ref({ x: 0, y: 0 })
const qualityOptions = QUALITY_OPTIONS
const isDownloadingAll = ref(false)
const downloadAllButtonRef = ref<HTMLElement | null>(null)

onBeforeUpdate(() => {
  songRefs.value = []
})

const setSongRef = (el: Element | null, index: number) => {
  const div = el as HTMLDivElement | null
  songRefs.value[index] = div
}

const formatSongTitle = (song: any) => {
  if (!song) return ''
  return `${song.name ?? '未知歌曲'} - ${normalizeArtistField(song.artist)}`
}

const triggerImport = () => {
  if (importInputRef.value) {
    importInputRef.value.click()
  }
}

const handleImportChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) {
      throw new Error('播放列表文件格式错误')
    }
    playlistStore.songs = data
    showNotification(`已导入 ${data.length} 首歌曲到播放列表`, 'success')
  } catch (error: any) {
    console.error('导入播放列表失败:', error)
    showNotification(error?.message || '导入播放列表失败，请检查文件格式', 'error')
  } finally {
    if (input) input.value = ''
  }
}

const handleExport = () => {
  if (!playlistStore.songs.length) {
    showNotification('当前播放列表为空，无可导出的歌曲', 'warning')
    return
  }

  try {
    const blob = new Blob([JSON.stringify(playlistStore.songs, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `playlist-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showNotification(`已导出 ${playlistStore.songs.length} 首歌曲`, 'success')
  } catch (error) {
    console.error('导出播放列表失败:', error)
    showNotification('导出播放列表失败，请稍后重试', 'error')
  }
}

const handleClear = () => {
  if (!playlistStore.songs.length) return
  playlistStore.clearPlaylist()
  showNotification('播放列表已清空', 'success')
}

// 下载全部
async function handleDownloadAll() {
  if (playlistStore.songs.length === 0) {
    showNotification('播放列表为空', 'warning')
    return
  }

  if (isDownloadingAll.value) {
    return
  }

  isDownloadingAll.value = true
  try {
    // 获取所有歌曲
    const allSongs = playlistStore.songs

    // 批量下载（使用当前选择的音质）
    // 传递批量下载按钮元素，只触发一个动画
    await downloadSongs(allSongs, usePlayerStore().quality, undefined, downloadAllButtonRef.value || undefined)
  } catch (error: any) {
    console.error('批量下载失败:', error)
    showNotification(error?.message || '批量下载失败', 'error')
  } finally {
    isDownloadingAll.value = false
  }
}

const handleRemove = (index: number) => {
  playlistStore.removeSong(index)
}

async function handleDownload(song: any, quality: string) {
  if (!song) return

  closeDownloadMenu()

  // 获取源元素用于动画
  const songIndex = playlistStore.songs.findIndex(s => s.id === song.id && s.source === song.source)
  const sourceElement = songIndex >= 0 && songRefs.value[songIndex] 
    ? songRefs.value[songIndex] 
    : undefined

  // 使用新的下载系统
  await downloadSong(song, quality as any, sourceElement || undefined)
}

function toggleDownloadMenu(index: number, event: MouseEvent) {
  if (showDownloadMenu.value === index) {
    closeDownloadMenu()
    return
  }

  const button = event.currentTarget as HTMLElement | null
  if (button) {
    const rect = button.getBoundingClientRect()
    const menuWidth = 190
    const padding = 12
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : menuWidth + padding * 2
    const maxLeft = Math.max(padding, viewportWidth - menuWidth - padding)
    const clampedLeft = Math.min(Math.max(rect.left, padding), maxLeft)

    downloadMenuPosition.value = {
      x: clampedLeft,
      y: rect.bottom + 6
    }
  }

  showDownloadMenu.value = index
  activeDownloadSong.value = playlistStore.songs[index] || null
}

function closeDownloadMenu() {
  if (showDownloadMenu.value !== null) {
    showDownloadMenu.value = null
    activeDownloadSong.value = null
  }
}

function handleListScroll() {
  closeDownloadMenu()
}

const scrollToCurrentSong = () => {
  if (
    playlistStore.currentIndex < 0 ||
    !listRef.value ||
    !songRefs.value[playlistStore.currentIndex]
  ) {
    return
  }

  const container = listRef.value
  const target = songRefs.value[playlistStore.currentIndex]
  if (!target) return
  const targetTop = target.offsetTop
  const targetBottom = targetTop + target.offsetHeight
  const viewTop = container.scrollTop
  const viewBottom = viewTop + container.clientHeight

  if (targetTop < viewTop) {
    container.scrollTo({ top: Math.max(targetTop - 16, 0), behavior: 'smooth' })
  } else if (targetBottom > viewBottom) {
    const offset = targetBottom - container.clientHeight + 16
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement

  if (
    showDownloadMenu.value !== null &&
    !target.closest('[data-download-menu]') &&
    !target.closest('[data-download-trigger]')
  ) {
    closeDownloadMenu()
  }
}

watch(
  () => [playlistStore.currentIndex, playlistStore.songs.length],
  async () => {
    await nextTick()
    scrollToCurrentSong()
  },
  { immediate: true }
)

watch(
  () => playlistStore.songs.length,
  () => {
    closeDownloadMenu()
  }
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
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
