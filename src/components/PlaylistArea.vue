<template>
  <div 
    class="rounded-4 p-5 border flex flex-col relative h-full min-h-[220px] overflow-hidden transition-all duration-500"
    style="grid-area: playlist; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); padding-top: 72px;"
    :class="[
      store.isDark ? 'bg-[#2c2c2c]/50 border-white/15' : 'bg-white/50 border-black/10',
      store.playlist.length === 0 ? 'items-center justify-center' : 'items-stretch justify-start'
    ]"
  >
    <!-- 播放列表标题 / 操作区（参考 Solara） -->
    <div
      class="absolute top-4 left-5 right-3 flex items-center justify-between gap-4 z-5 pointer-events-none"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0 pointer-events-auto">
        <div
          class="inline-flex items-center justify-center px-0 py-0 text-[15px] font-semibold tracking-wide"
          :class="store.isDark ? 'text-white' : 'text-[#2c3e50]'"
        >
          播放列表
        </div>
      </div>
      <div class="flex items-center gap-2 pointer-events-auto">
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
          :class="store.isDark ? 'bg-[#181e28]/85 border-white/20 text-[#bdc3c7] hover:text-[#1abc9c]' : 'border-black/5 text-[#7f8c8d] hover:text-[#1abc9c]'"
          type="button"
          title="导入播放列表"
          @click="triggerImport"
        >
          <i class="fas fa-file-import text-[14px]"></i>
        </button>

        <!-- 导出播放列表 -->
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white/80 shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
          :class="store.isDark ? 'bg-[#181e28]/85 border-white/20 text-[#bdc3c7] hover:text-[#16a085]' : 'border-black/5 text-[#7f8c8d] hover:text-[#16a085]'"
          type="button"
          title="导出播放列表"
          @click="handleExport"
          :disabled="store.playlist.length === 0"
        >
          <i class="fas fa-file-export text-[14px]"></i>
        </button>

        <!-- 清空播放列表 -->
        <button
          class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white/80 shadow-[0_8px_18px_rgba(231,76,60,0.2)]"
          :class="store.isDark ? 'bg-[#181e28]/85 border-[#e74c3c]/40 text-[#e74c3c] hover:text-[#ff6b5a]' : 'border-[#e74c3c]/35 text-[#e74c3c] hover:text-[#ff6b5a]'"
          type="button"
          title="清空播放列表"
          @click="handleClear"
          :disabled="store.playlist.length === 0"
        >
          <i class="fas fa-trash text-[14px]"></i>
        </button>
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
    <div
      v-else
      ref="listRef"
      class="flex-1 w-full overflow-y-auto pr-2 -mr-2"
      style="overscroll-behavior: contain;"
    >
      <div class="w-full">
        <div 
          v-for="(song, index) in store.playlist" 
          :key="index"
          @click="store.playAtIndex(index)"
          class="group playlist-row cursor-pointer"
          :ref="(el) => setSongRef(el as unknown as Element | null, index)"
          :title="formatSongTitle(song)"
          :class="[
            store.currentIndex === index 
              ? 'text-[#1abc9c] font-medium bg-[#1abc9c]/20' 
              : store.isDark 
                ? 'text-[#ecf0f1] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]' 
                : 'text-[#2c3e50] hover:bg-[#1abc9c]/10 hover:text-[#1abc9c]'
          ]"
        >
          <span class="inline-block max-w-full truncate align-middle">
            {{ song.name }} - {{ normalizeArtistField(song.artist) }}
          </span>

          <!-- 下载 / 删除按钮：hover 时显示，样式和动效参考 Solara -->
          <button
            class="playlist-item-download"
            type="button"
            title="下载这首歌"
            @click.stop="handleSongDownload(song)"
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
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUpdate, ref, watch } from 'vue'
import { useAppStore, normalizeArtistField } from '../store'
import { getSongUrl } from '../api'

const store = useAppStore()
const listRef = ref<HTMLDivElement | null>(null)
const songRefs = ref<(HTMLDivElement | null)[]>([])
const importInputRef = ref<HTMLInputElement | null>(null)

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
    ;(store as any).playlist = data
    store.showNotification(`已导入 ${data.length} 首歌曲到播放列表`, 'success')
  } catch (error: any) {
    console.error('导入播放列表失败:', error)
    store.showNotification(error?.message || '导入播放列表失败，请检查文件格式', 'error')
  } finally {
    if (input) input.value = ''
  }
}

const handleExport = () => {
  if (!store.playlist.length) {
    store.showNotification('当前播放列表为空，无可导出的歌曲', 'warning')
    return
  }

  try {
    const blob = new Blob([JSON.stringify(store.playlist, null, 2)], {
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
    store.showNotification(`已导出 ${store.playlist.length} 首歌曲`, 'success')
  } catch (error) {
    console.error('导出播放列表失败:', error)
    store.showNotification('导出播放列表失败，请稍后重试', 'error')
  }
}

const handleClear = () => {
  if (!store.playlist.length) return
  store.clearPlaylist()
  store.showNotification('播放列表已清空', 'success')
}

const handleRemove = (index: number) => {
  store.removeFromPlaylist(index)
}

const handleSongDownload = async (song: any) => {
  if (!song) return

  try {
    store.showNotification('正在准备下载...', 'info')

    const response = await getSongUrl(
      song.id,
      song.source,
      store.quality === 'flac' ? '999' : store.quality
    )
    const url = response?.data?.url
    if (!url) {
      throw new Error('无法获取下载链接')
    }

    if ((window as any).electronAPI) {
      const filename = `${song.name} - ${normalizeArtistField(song.artist)}`
      const result = await (window as any).electronAPI.downloadMusic({
        id: song.id,
        source: song.source,
        quality: store.quality === 'flac' ? '999' : store.quality,
        filename
      })

      if (result.success) {
        store.showNotification('下载成功', 'success')
      } else if (result.canceled) {
        return
      } else {
        throw new Error(result.error || '下载失败')
      }
    } else {
      const link = document.createElement('a')
      link.href = url
      link.download = `${song.name} - ${normalizeArtistField(song.artist)}.${store.quality === 'flac' ? 'flac' : 'mp3'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      store.showNotification('下载已开始', 'success')
    }
  } catch (error: any) {
    console.error('下载失败:', error)
    store.showNotification(error?.message || '下载失败，请稍后重试', 'error')
  }
}

const scrollToCurrentSong = () => {
  if (
    store.currentIndex < 0 ||
    !listRef.value ||
    !songRefs.value[store.currentIndex]
  ) {
    return
  }

  const container = listRef.value
  const target = songRefs.value[store.currentIndex]
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

watch(
  () => [store.currentIndex, store.playlist.length],
  async () => {
    await nextTick()
    scrollToCurrentSong()
  },
  { immediate: true }
)
</script>
