/**
 * 并发下载控制器
 * 控制同时下载的歌曲数量（默认最多3首）
 */

interface DownloadTask {
  id: string
  promise: Promise<void>
  resolve: () => void
  reject: (error: any) => void
  downloadFn: () => Promise<void> // 保存每个任务的下载函数
}

class ConcurrentDownloadController {
  private maxConcurrent: number = 3
  private runningTasks: Map<string, DownloadTask> = new Map()
  private waitingQueue: DownloadTask[] = []
  private downloadFnMap: Map<string, () => Promise<void>> = new Map() // 保存任务ID到下载函数的映射

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * 添加下载任务
   * @param taskId 任务ID
   * @param downloadFn 下载函数
   * @returns Promise<void>
   */
  async addTask(taskId: string, downloadFn: () => Promise<void>): Promise<void> {
    // 如果任务已存在，返回现有的Promise
    const existingTask = this.runningTasks.get(taskId)
    if (existingTask) {
      return existingTask.promise
    }

    // 检查等待队列中是否已存在
    const existingWaitingTask = this.waitingQueue.find(t => t.id === taskId)
    if (existingWaitingTask) {
      return existingWaitingTask.promise
    }

    // 保存下载函数
    this.downloadFnMap.set(taskId, downloadFn)

    // 创建新的任务
    let resolve!: () => void
    let reject!: (error: any) => void
    const promise = new Promise<void>((res, rej) => {
      resolve = res
      reject = rej
    })

    const task: DownloadTask = {
      id: taskId,
      promise,
      resolve,
      reject,
      downloadFn // 保存下载函数
    }

    // 如果当前运行的任务数小于最大并发数，立即执行
    if (this.runningTasks.size < this.maxConcurrent) {
      this.runningTasks.set(taskId, task)
      this.executeTask(task)
    } else {
      // 否则加入等待队列
      this.waitingQueue.push(task)
    }

    return promise
  }

  /**
   * 执行下载任务
   */
  private async executeTask(task: DownloadTask): Promise<void> {
    try {
      await task.downloadFn()
      task.resolve()
    } catch (error) {
      task.reject(error)
    } finally {
      // 任务完成，从运行列表中移除
      this.runningTasks.delete(task.id)
      this.downloadFnMap.delete(task.id)
      
      // 处理等待队列中的下一个任务
      if (this.waitingQueue.length > 0) {
        const nextTask = this.waitingQueue.shift()!
        this.runningTasks.set(nextTask.id, nextTask)
        this.executeTask(nextTask)
      }
    }
  }

  /**
   * 移除任务（取消下载）
   */
  removeTask(taskId: string): void {
    // 从运行列表中移除
    const runningTask = this.runningTasks.get(taskId)
    if (runningTask) {
      this.runningTasks.delete(taskId)
      this.downloadFnMap.delete(taskId)
      runningTask.reject(new Error('任务已取消'))
      
      // 处理等待队列中的下一个任务
      if (this.waitingQueue.length > 0) {
        const nextTask = this.waitingQueue.shift()!
        this.runningTasks.set(nextTask.id, nextTask)
        this.executeTask(nextTask)
      }
    }

    // 从等待队列中移除
    const waitingIndex = this.waitingQueue.findIndex(t => t.id === taskId)
    if (waitingIndex >= 0) {
      const waitingTask = this.waitingQueue[waitingIndex]
      this.waitingQueue.splice(waitingIndex, 1)
      this.downloadFnMap.delete(taskId)
      waitingTask.reject(new Error('任务已取消'))
    }
  }

  /**
   * 获取当前运行的任务数
   */
  getRunningCount(): number {
    return this.runningTasks.size
  }

  /**
   * 获取等待队列长度
   */
  getWaitingCount(): number {
    return this.waitingQueue.length
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max
    
    // 如果新的最大并发数大于当前运行数，启动等待队列中的任务
    while (this.runningTasks.size < this.maxConcurrent && this.waitingQueue.length > 0) {
      const nextTask = this.waitingQueue.shift()!
      this.runningTasks.set(nextTask.id, nextTask)
      this.executeTask(nextTask)
    }
  }
}

// 单例模式
export const concurrentDownloadController = new ConcurrentDownloadController(3)

