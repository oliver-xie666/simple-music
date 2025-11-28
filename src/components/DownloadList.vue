<template>
  <div class="flex flex-col h-full" :class="mobile && mobile.isMobileView.value ? 'min-w-0' : 'min-w-[400px]'">
    <!-- 标题栏 -->
    <div 
      v-if="!mobile || !mobile.isMobileView.value"
      class="flex items-center justify-between px-4 py-3 border-b"
      :class="themeStore.isDark ? 'border-white/15 bg-[#1e1e1e]' : 'border-black/10 bg-white/90'"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-download text-[#1abc9c]"></i>
        <div class="font-semibold text-sm"
          :class="themeStore.isDark ? 'text-white' : 'text-[#2c3e50]'">
          下载列表
        </div>
        <div v-if="downloadStore.activeTasks.length > 0" 
          class="text-xs px-1.5 py-0.5 rounded-full bg-[#1abc9c]/20 text-[#1abc9c]">
          {{ downloadStore.activeTasks.length }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="downloadStore.tasks.length > 0"
          @click="handleClearAll"
          class="text-xs px-2 py-1 rounded transition-colors"
          :class="themeStore.isDark 
            ? 'text-[#e74c3c] hover:text-white hover:bg-[#e74c3c]/20' 
            : 'text-[#e74c3c] hover:text-white hover:bg-[#e74c3c]/10'"
          title="清除全部"
        >
          <i class="fas fa-trash-alt mr-1"></i>清除全部
        </button>
        <button
          v-if="downloadStore.completedTasks.length > 0"
          @click="downloadStore.clearCompletedTasks()"
          class="text-xs px-2 py-1 rounded transition-colors"
          :class="themeStore.isDark 
            ? 'text-[#95a5a6] hover:text-white hover:bg-white/10' 
            : 'text-[#7f8c8d] hover:text-[#2c3e50] hover:bg-black/5'"
          title="清除已完成"
        >
          <i class="fas fa-check-double mr-1"></i>清除已完成
        </button>
        <button
          v-if="downloadStore.failedTasks.length > 0"
          @click="downloadStore.clearFailedTasks()"
          class="text-xs px-2 py-1 rounded transition-colors"
          :class="themeStore.isDark 
            ? 'text-[#95a5a6] hover:text-white hover:bg-white/10' 
            : 'text-[#7f8c8d] hover:text-[#2c3e50] hover:bg-black/5'"
          title="清除失败"
        >
          <i class="fas fa-times-circle mr-1"></i>清除失败
        </button>
      </div>
    </div>

    <!-- 下载列表内容 -->
    <div 
      class="flex-1 overflow-y-auto overflow-x-hidden"
      :class="[
        mobile && mobile.isMobileView.value ? 'p-0' : 'p-3 max-h-[calc(500px-60px)]',
        mobile && mobile.isMobileView.value 
          ? 'bg-transparent'
          : (themeStore.isDark ? 'bg-[#1a1a1a]' : 'bg-[#f8f9fa]')
      ]"
    >
      <div v-if="downloadStore.tasks.length === 0" 
        class="text-center"
        :class="mobile && mobile.isMobileView.value ? 'py-16' : 'py-12'"
      >
        <i 
          class="fas fa-inbox mb-3"
          :class="[
            themeStore.isDark ? 'text-[#95a5a6]/30' : 'text-[#7f8c8d]/30',
            mobile && mobile.isMobileView.value ? 'text-5xl' : 'text-4xl'
          ]"
        ></i>
        <div 
          :class="[
            themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]',
            mobile && mobile.isMobileView.value ? 'text-base' : 'text-sm'
          ]"
        >
          暂无下载任务
        </div>
      </div>

      <div 
        v-else 
        :class="mobile && mobile.isMobileView.value ? 'space-y-3 px-4' : 'space-y-2.5'"
      >
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="rounded-lg transition-all cursor-pointer group"
          :class="[
            mobile && mobile.isMobileView.value ? 'p-4' : 'p-3.5 hover:shadow-md',
            themeStore.isDark 
              ? 'bg-white/5 border-white/10 hover:bg-white/10'
              : 'bg-white/70 border-black/10 hover:bg-white/90',
            task.status === 'completed' 
              ? (themeStore.isDark ? 'border-[#1abc9c]/40 bg-[#1abc9c]/5' : 'border-[#1abc9c]/30 bg-[#1abc9c]/5')
              : task.status === 'failed'
              ? (themeStore.isDark ? 'border-[#e74c3c]/40 bg-[#e74c3c]/5' : 'border-[#e74c3c]/30 bg-[#e74c3c]/5')
              : task.status === 'downloading'
              ? (themeStore.isDark ? 'border-[#1abc9c]/30 bg-[#1abc9c]/5' : 'border-[#1abc9c]/20 bg-[#1abc9c]/5')
              : (themeStore.isDark ? 'border-white/10' : 'border-black/10')
            ,
            mobile && mobile.isMobileView.value ? 'border border-solid' : ''
          ]"
        >
          <!-- 歌曲信息 -->
          <div class="flex items-start gap-3 mb-3">
            <!-- 封面占位 -->
            <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-[#1abc9c] to-[#16a085] flex items-center justify-center"
              :class="task.status === 'failed' ? 'from-[#e74c3c] to-[#c0392b]' : ''">
              <i :class="getStatusIcon(task.status)" class="text-white text-lg"></i>
            </div>
            
            <div class="flex-1 min-w-0">
              <div 
                class="truncate mb-0.5 font-medium"
                :class="[
                  mobile && mobile.isMobileView.value ? 'text-base' : 'text-sm',
                  themeStore.isDark ? 'text-white' : 'text-[#2c3e50]'
                ]"
              >
                {{ task.displayName || task.song.name }}
              </div>
              <div 
                class="truncate mb-1"
                :class="[
                  mobile && mobile.isMobileView.value ? 'text-sm' : 'text-xs',
                  themeStore.isDark ? 'text-white/70' : 'text-[#7f8c8d]'
                ]"
              >
                {{ normalizeArtistField(task.song.artist) }}
              </div>
              <div 
                class="flex items-center gap-2"
                :class="[
                  mobile && mobile.isMobileView.value ? 'text-sm' : 'text-xs',
                  themeStore.isDark ? 'text-white/60' : 'text-[#7f8c8d]'
                ]"
              >
                <span 
                  class="px-1.5 py-0.5 rounded"
                  :class="themeStore.isDark ? 'bg-white/10' : 'bg-black/10'"
                >
                  {{ task.quality.toUpperCase() }}
                </span>
                <span v-if="task.total">
                  {{ formatFileSize(task.total) }}
                </span>
              </div>
            </div>
            
            <button
              @click.stop="downloadStore.removeTask(task.id)"
              class="flex-shrink-0 flex items-center justify-center rounded-full transition-colors opacity-0 group-hover:opacity-100"
              :class="[
                mobile && mobile.isMobileView.value ? 'w-8 h-8 opacity-100' : 'w-7 h-7',
                themeStore.isDark 
                  ? 'text-white/60 hover:text-white hover:bg-white/10' 
                  : 'text-[#7f8c8d] hover:text-[#2c3e50] hover:bg-black/5'
              ]"
              title="移除"
            >
              <i :class="mobile && mobile.isMobileView.value ? 'fas fa-times text-sm' : 'fas fa-times text-xs'"></i>
            </button>
          </div>

          <!-- 状态和进度 -->
          <div class="space-y-2">
            <!-- 等待中 -->
            <div v-if="task.status === 'pending'" 
              class="flex items-center gap-2 text-xs py-1"
              :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'">
              <i class="fas fa-clock text-[#95a5a6]"></i>
              <span>等待下载...</span>
            </div>

            <!-- 下载中：显示进度条和速度 -->
            <div v-else-if="task.status === 'downloading'" 
              class="space-y-1.5">
              <div 
                :class="[
                  mobile && mobile.isMobileView.value ? 'flex flex-col gap-1.5' : 'flex items-center justify-between',
                  mobile && mobile.isMobileView.value ? 'text-sm' : 'text-xs'
                ]"
              >
                <div 
                  :class="[
                    mobile && mobile.isMobileView.value ? 'flex items-center justify-between w-full' : 'flex items-center gap-2',
                    themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <i class="fas fa-spinner fa-spin text-[#1abc9c]"></i>
                    <span>下载中</span>
                    <span v-if="task.speed" class="text-[#1abc9c] font-medium">
                      {{ formatSpeed(task.speed) }}
                    </span>
                  </div>
                  <span class="font-medium text-[#1abc9c]">
                    {{ Math.round(task.progress) }}%
                  </span>
                </div>
                <div 
                  v-if="mobile && mobile.isMobileView.value"
                  class="flex items-center justify-between w-full text-xs"
                  :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
                >
                  <span v-if="task.downloaded && task.total">
                    {{ formatFileSize(task.downloaded) }} / {{ formatFileSize(task.total) }}
                  </span>
                  <button
                    @click.stop="cancelDownload(task.id)"
                    class="flex items-center gap-1 px-2 py-1 rounded transition-colors"
                    :class="themeStore.isDark 
                      ? 'text-[#e74c3c] hover:bg-[#e74c3c]/10' 
                      : 'text-[#e74c3c] hover:bg-[#e74c3c]/5'"
                    title="取消下载"
                  >
                    <i class="fas fa-times"></i>
                    <span>取消</span>
                  </button>
                </div>
                <div 
                  v-else
                  class="flex items-center gap-2"
                  :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'"
                >
                  <span v-if="task.downloaded && task.total">
                    {{ formatFileSize(task.downloaded) }} / {{ formatFileSize(task.total) }}
                  </span>
                  <button
                    @click.stop="cancelDownload(task.id)"
                    class="ml-2 text-xs px-2 py-1 rounded transition-colors"
                    :class="themeStore.isDark 
                      ? 'text-[#e74c3c] hover:bg-[#e74c3c]/10' 
                      : 'text-[#e74c3c] hover:bg-[#e74c3c]/5'"
                    title="取消下载"
                  >
                    <i class="fas fa-times mr-1"></i>取消
                  </button>
                </div>
              </div>
              <div class="w-full h-2 rounded-full overflow-hidden relative"
                :class="themeStore.isDark ? 'bg-white/10' : 'bg-black/10'">
                <div 
                  class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#1abc9c] to-[#16a085] relative overflow-hidden"
                  :style="{ width: `${task.progress}%` }"
                >
                  <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div 
                v-if="task.speed && task.total && task.downloaded" 
                :class="[
                  mobile && mobile.isMobileView.value ? 'text-sm' : 'text-xs',
                  themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'
                ]"
              >
                预计剩余时间: {{ formatRemainingTime(task.total - task.downloaded, task.speed) }}
              </div>
            </div>

            <!-- 已暂停 -->
            <div v-else-if="task.status === 'paused'" 
              class="space-y-1.5">
              <div class="flex items-center gap-2 text-xs text-[#f39c12]">
                <i class="fas fa-pause-circle"></i>
                <span>已暂停</span>
              </div>
              <div class="w-full h-2 rounded-full overflow-hidden relative"
                :class="themeStore.isDark ? 'bg-white/10' : 'bg-black/10'">
                <div 
                  class="h-full rounded-full bg-gradient-to-r from-[#f39c12] to-[#e67e22]"
                  :style="{ width: `${task.progress}%` }"
                ></div>
              </div>
              <div v-if="task.downloaded && task.total" 
                class="text-xs"
                :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'">
                已下载: {{ formatFileSize(task.downloaded) }} / {{ formatFileSize(task.total) }}
              </div>
            </div>


            <!-- 已完成 -->
            <div v-else-if="task.status === 'completed'" 
              class="flex items-center justify-between py-1">
              <div class="flex items-center gap-2 text-xs text-[#1abc9c]">
                <i class="fas fa-check-circle"></i>
                <span>下载完成</span>
                <span v-if="task.endTime && task.startTime" class="text-[#95a5a6]">
                  ({{ formatDuration(task.endTime - task.startTime) }})
                </span>
              </div>
              <button
                v-if="task.filePath"
                @click="openFileLocation(task.filePath)"
                class="text-xs px-2 py-1 rounded transition-colors"
                :class="themeStore.isDark 
                  ? 'text-[#1abc9c] hover:bg-[#1abc9c]/10' 
                  : 'text-[#1abc9c] hover:bg-[#1abc9c]/5'"
                title="打开文件位置"
              >
                <i class="fas fa-folder-open mr-1"></i>打开位置
              </button>
            </div>

            <!-- 失败 -->
            <div v-else-if="task.status === 'failed'" 
              class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs text-[#e74c3c]">
                  <i class="fas fa-exclamation-circle"></i>
                  <span>下载失败</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="retryDownload(task)"
                    class="text-xs px-2 py-1 rounded transition-colors"
                    :class="themeStore.isDark 
                      ? 'text-[#1abc9c] hover:bg-[#1abc9c]/10' 
                      : 'text-[#1abc9c] hover:bg-[#1abc9c]/5'"
                    title="重新下载"
                  >
                    <i class="fas fa-redo mr-1"></i>重试
                  </button>
                  <button
                    @click="downloadStore.removeTask(task.id)"
                    class="text-xs px-2 py-1 rounded transition-colors"
                    :class="themeStore.isDark 
                      ? 'text-[#95a5a6] hover:bg-white/10' 
                      : 'text-[#7f8c8d] hover:bg-black/5'"
                    title="移除"
                  >
                    <i class="fas fa-trash mr-1"></i>移除
                  </button>
                </div>
              </div>
              <div v-if="task.error" 
                class="text-xs px-2 py-1 rounded bg-[#e74c3c]/10 text-[#e74c3c]">
                {{ task.error }}
              </div>
            </div>

            <!-- 已取消 -->
            <div v-else-if="task.status === 'cancelled'" 
              class="flex items-center justify-between py-1">
              <div class="flex items-center gap-2 text-xs"
                :class="themeStore.isDark ? 'text-[#95a5a6]' : 'text-[#7f8c8d]'">
                <i class="fas fa-times-circle"></i>
                <span>已取消</span>
              </div>
              <button
                @click="downloadStore.removeTask(task.id)"
                class="text-xs px-2 py-1 rounded transition-colors"
                :class="themeStore.isDark 
                  ? 'text-[#95a5a6] hover:bg-white/10' 
                  : 'text-[#7f8c8d] hover:bg-black/5'"
                title="移除"
              >
                <i class="fas fa-trash mr-1"></i>移除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useDownloadStore } from '../stores/download'
import { useThemeStore } from '../stores/theme'
import { useDownload } from '../composables/useDownload'
import { normalizeArtistField } from '../utils/song-utils'
import type { DownloadTask } from '../stores/download'

const downloadStore = useDownloadStore()
const themeStore = useThemeStore()
const { retryDownload, cancelDownload, cancelAllDownloads } = useDownload()
const mobile = inject<any>('mobile', null)

// 排序任务：正在下载的排在前面，等待中的在后面，其他状态按原顺序
const sortedTasks = computed(() => {
  const tasks = [...downloadStore.tasks]
  return tasks.sort((a, b) => {
    // 正在下载的排在前面
    if (a.status === 'downloading' && b.status !== 'downloading') return -1
    if (a.status !== 'downloading' && b.status === 'downloading') return 1
    
    // 等待中的排在下载中后面
    if (a.status === 'pending' && b.status !== 'pending' && b.status !== 'downloading') return -1
    if (a.status !== 'pending' && b.status === 'pending' && a.status !== 'downloading') return 1
    
    // 其他状态保持原顺序（按添加时间，新任务在前）
    return 0
  })
})

function getStatusIcon(status: DownloadTask['status']): string {
  switch (status) {
    case 'pending':
      return 'fas fa-clock'
    case 'downloading':
      return 'fas fa-spinner fa-spin'
    case 'paused':
      return 'fas fa-pause-circle'
    case 'completed':
      return 'fas fa-check-circle'
    case 'failed':
      return 'fas fa-exclamation-circle'
    case 'cancelled':
      return 'fas fa-times-circle'
    default:
      return 'fas fa-question-circle'
  }
}



// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 格式化下载速度
function formatSpeed(bytesPerSecond?: number): string {
  if (!bytesPerSecond) return ''
  return formatFileSize(bytesPerSecond) + '/s'
}

// 格式化剩余时间
function formatRemainingTime(remainingBytes: number, speed: number): string {
  if (speed <= 0) return '计算中...'
  const seconds = Math.ceil(remainingBytes / speed)
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}分${secs}秒`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分`
}

// 格式化持续时间
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}分${secs}秒`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分`
}

// 打开文件位置
async function openFileLocation(filePath: string) {
  if ((window as any).electronAPI) {
    // 通过 IPC 调用 Electron 的 shell.showItemInFolder
    try {
      await (window as any).electronAPI.showItemInFolder?.(filePath)
    } catch (error) {
      console.error('打开文件位置失败:', error)
    }
  }
}

// 清空全部任务（先取消所有正在下载的任务）
async function handleClearAll() {
  // 先取消所有正在进行的下载
  await cancelAllDownloads()
  
  // 然后清空任务列表
  downloadStore.clearAllTasks()
}
</script>

