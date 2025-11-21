import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, QualityType } from '../types'

export interface DownloadTask {
  id: string
  song: Song
  quality: QualityType
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  error?: string
  filePath?: string
  tempFilePath?: string // 临时文件路径（未完成下载的文件）
  startTime?: number
  endTime?: number
  speed?: number // 下载速度（字节/秒）
  downloaded?: number // 已下载字节数
  total?: number // 总字节数
  displayName?: string // 显示名称（带序号，如"歌曲(1)"）
}

export const useDownloadStore = defineStore('download', () => {
  // State
  const tasks = ref<DownloadTask[]>([])
  const showDownloadList = ref(false)

  // Getters
  const activeTasks = computed(() => 
    tasks.value.filter(t => t.status === 'pending' || t.status === 'downloading' || t.status === 'paused')
  )

  const completedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'completed')
  )

  const failedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'failed')
  )

  const hasActiveDownloads = computed(() => activeTasks.value.length > 0)

  const totalProgress = computed(() => {
    if (activeTasks.value.length === 0) return 0
    const sum = activeTasks.value.reduce((acc, task) => acc + task.progress, 0)
    return Math.round(sum / activeTasks.value.length)
  })

  // Actions
  function generateTaskId(song: Song, quality: QualityType): string {
    return `${song.source}:${song.id}:${quality}:${Date.now()}`
  }

  /**
   * 检查是否存在相同歌曲和音质的任务（所有状态）
   */
  function findExistingTask(song: Song, quality: QualityType): DownloadTask | undefined {
    return tasks.value.find(
      t => t.song.id === song.id && 
           t.song.source === song.source && 
           t.quality === quality
    )
  }

  /**
   * 添加下载任务
   * @returns 如果已存在相同音质的任务，返回 null；否则返回任务ID
   */
  function addDownloadTask(song: Song, quality: QualityType): string | null {
    // 检查是否已存在相同歌曲和音质的任务（所有状态）
    const existing = findExistingTask(song, quality)
    
    if (existing) {
      // 如果已存在相同音质的任务（任何状态），返回 null（表示已存在）
      return null
    }

    const taskId = generateTaskId(song, quality)
    const task: DownloadTask = {
      id: taskId,
      song,
      quality,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    }

    tasks.value.unshift(task) // 新任务添加到顶部
    
    // 更新所有相同歌曲任务的显示名称（重新计算序号）
    updateDisplayNamesForSong(song)
    
    return taskId
  }

  /**
   * 更新相同歌曲的所有任务的显示名称
   * 新任务（后面添加的，在数组顶部）显示序号，旧任务显示原名称
   */
  function updateDisplayNamesForSong(song: Song) {
    const sameSongTasks = tasks.value.filter(
      t => t.song.id === song.id && t.song.source === song.source
    )
    
    // 如果只有一个任务，显示原名称
    if (sameSongTasks.length === 1) {
      sameSongTasks[0].displayName = sameSongTasks[0].song.name
      return
    }
    
    // 如果有多个任务，新任务（index 0）显示序号，旧任务显示原名称
    sameSongTasks.forEach((task, index) => {
      if (index === 0) {
        // 新任务（后面添加的）显示序号
        task.displayName = `${task.song.name}(1)`
      } else {
        // 旧任务显示原名称
        task.displayName = task.song.name
      }
    })
  }

  function updateTaskProgress(
    taskId: string, 
    progress: number, 
    extra?: { speed?: number; downloaded?: number; total?: number }
  ) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress))
      if (task.status === 'pending') {
        task.status = 'downloading'
      }
      if (extra) {
        if (extra.speed !== undefined) task.speed = extra.speed
        if (extra.downloaded !== undefined) task.downloaded = extra.downloaded
        if (extra.total !== undefined) task.total = extra.total
      }
    }
  }

  function completeTask(taskId: string, filePath?: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = 'completed'
      task.progress = 100
      task.filePath = filePath
      task.endTime = Date.now()
    }
  }

  function failTask(taskId: string, error: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = 'failed'
      task.error = error
      task.endTime = Date.now()
    }
  }

  function cancelTask(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = 'cancelled'
      task.endTime = Date.now()
    }
  }

  function setTempFilePath(taskId: string, tempFilePath: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.tempFilePath = tempFilePath
    }
  }

  function pauseTask(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.status === 'downloading') {
      task.status = 'paused'
    }
  }

  function resumeTask(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.status === 'paused') {
      task.status = 'downloading'
    }
  }

  function removeTask(taskId: string) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index >= 0) {
      const task = tasks.value[index]
      tasks.value.splice(index, 1)
      // 删除任务后，更新相同歌曲的其他任务的显示名称
      if (task) {
        updateDisplayNamesForSong(task.song)
      }
    }
  }

  function clearCompletedTasks() {
    tasks.value = tasks.value.filter(t => t.status !== 'completed')
  }

  function clearFailedTasks() {
    tasks.value = tasks.value.filter(t => t.status !== 'failed')
  }

  function clearAllTasks() {
    tasks.value = []
  }

  function toggleDownloadList() {
    showDownloadList.value = !showDownloadList.value
  }

  function setShowDownloadList(show: boolean) {
    showDownloadList.value = show
  }

  return {
    // State
    tasks,
    showDownloadList,
    // Getters
    activeTasks,
    completedTasks,
    failedTasks,
    hasActiveDownloads,
    totalProgress,
    // Actions
    addDownloadTask,
    updateTaskProgress,
    completeTask,
    failTask,
    cancelTask,
    pauseTask,
    resumeTask,
    removeTask,
    clearCompletedTasks,
    clearFailedTasks,
    clearAllTasks,
    toggleDownloadList,
    setShowDownloadList,
    setTempFilePath,
  }
})

