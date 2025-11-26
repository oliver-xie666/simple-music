import { useDownloadStore } from '../stores/download'
import { normalizeArtistField, sanitizeFilenameSegment } from '../utils/song-utils'
import { getSongUrl } from '../api/adapter'
import { useNotification } from './useNotification'
import type { Song, QualityType } from '../types'
import { concurrentDownloadController } from '../utils/concurrent-download'

// 存储 Web 环境的下载控制器
const webDownloadControllers = new Map<string, AbortController>()

/**
 * 生成唯一的文件名（Web 环境）
 * 使用 localStorage 跟踪已下载的文件名，避免冲突
 * @param baseFilename 基础文件名（不含扩展名）
 * @param ext 文件扩展名
 * @returns 唯一的文件名
 */
function getUniqueFilenameForWeb(baseFilename: string, ext: string): string {
  const storageKey = 'downloaded-files'
  const downloadedFiles = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[]
  
  // 检查基础文件名是否已存在
  const fullFilename = `${baseFilename}.${ext}`
  if (!downloadedFiles.includes(fullFilename)) {
    downloadedFiles.push(fullFilename)
    localStorage.setItem(storageKey, JSON.stringify(downloadedFiles))
    return fullFilename
  }
  
  // 如果存在，添加序号
  let counter = 1
  let newFilename: string
  
  do {
    newFilename = `${baseFilename}(${counter}).${ext}`
    counter++
  } while (downloadedFiles.includes(newFilename) && counter < 1000)
  
  // 保存新的文件名
  downloadedFiles.push(newFilename)
  localStorage.setItem(storageKey, JSON.stringify(downloadedFiles))
  
  return newFilename
}

export function useDownload() {
  const downloadStore = useDownloadStore()
  const { show: showNotification } = useNotification()

  /**
   * 执行下载（内部函数，不添加任务）
   * @param song 歌曲信息
   * @param quality 音质
   * @param taskId 任务ID（必须已存在）
   * @param sourceElement 可选的源元素（用于动画）
   */
  async function executeDownload(
    song: Song,
    quality: QualityType,
    taskId: string,
    sourceElement?: HTMLElement
  ) {
    // 如果提供了源元素，立即触发动画（不等待）
    if (sourceElement) {
      // 使用 nextTick 确保 DOM 已更新，下载按钮已渲染
      requestAnimationFrame(() => {
        triggerDownloadAnimation(sourceElement, taskId)
      })
    }

    try {
      const artistSafe = sanitizeFilenameSegment(normalizeArtistField(song.artist), '未知艺术家')
      const songSafe = sanitizeFilenameSegment(song.name, '未知歌曲')
      const filename = `${artistSafe}-${songSafe}`
      
      // 检查环境：Electron 或 Web
      if ((window as any).electronAPI) {
        // Electron 环境：使用 IPC 下载
        await downloadWithElectron(song, quality, filename, taskId)
      } else {
        // Web 环境：使用 fetch 下载
        await downloadWithWeb(song, quality, filename, taskId)
      }
    } catch (error: any) {
      console.error('下载失败:', error)
      // 检查任务状态，如果是暂停状态，不要取消任务
      const task = downloadStore.tasks.find(t => t.id === taskId)
      const isPaused = task?.status === 'paused'
      
      // 如果是用户取消（且不是暂停），标记为取消
      if ((error?.name === 'AbortError' || error?.message?.includes('取消')) && !isPaused) {
        downloadStore.cancelTask(taskId)
      } else if (!isPaused) {
        // 如果不是暂停状态，标记为失败
        downloadStore.failTask(taskId, error?.message || '下载失败，请稍后重试')
        // 显示下载失败通知（格式：歌手-歌曲下载失败）
        const artistName = normalizeArtistField(song.artist)
        showDownloadNotification(`${artistName}-${song.name}下载失败`, false, error?.message || '下载失败')
      }
      // 清理控制器（如果任务不是暂停状态）
      if (!isPaused) {
        webDownloadControllers.delete(taskId)
      }
    }
  }

  async function downloadSong(song: Song, quality: QualityType, sourceElement?: HTMLElement) {
    // 添加下载任务
    const taskId = downloadStore.addDownloadTask(song, quality)
    
    // 如果 taskId 为 null，说明已存在相同音质的任务
    if (taskId === null) {
      const artistName = normalizeArtistField(song.artist)
      showNotification(`${artistName}-${song.name}已存在下载列表`, 'warning')
      return
    }
    
    // 执行下载
    await executeDownload(song, quality, taskId, sourceElement)
  }

  // Electron 环境下载
  async function downloadWithElectron(
    song: Song,
    quality: QualityType,
    filename: string,
    taskId: string
  ) {
    try {
      const result = await (window as any).electronAPI.downloadMusic({
        id: song.id,
        source: song.source,
        quality: quality === 'flac' ? '999' : quality,
        filename,
        taskId: taskId
      }, (progressData: number | { progress: number; speed?: number; downloaded?: number; total?: number; tempFilePath?: string }) => {
        // 处理进度数据（可能是数字或对象）
        if (typeof progressData === 'number') {
          downloadStore.updateTaskProgress(taskId, progressData)
        } else {
          downloadStore.updateTaskProgress(taskId, progressData.progress, {
            speed: progressData.speed,
            downloaded: progressData.downloaded,
            total: progressData.total
          })
          // 保存临时文件路径（用于取消时删除）
          if (progressData.tempFilePath) {
            downloadStore.setTempFilePath(taskId, progressData.tempFilePath)
          }
        }
      })

      if (result.success) {
        // 确保进度是 100%
        downloadStore.updateTaskProgress(taskId, 100)
        downloadStore.completeTask(taskId, result.path)
        // 清除临时文件路径
        downloadStore.setTempFilePath(taskId, '')
        
        // 显示下载完成通知
        const artistName = normalizeArtistField(song.artist)
        showDownloadNotification(`${artistName}-${song.name}`, true)
      } else if (result.canceled) {
        // 删除未完成的文件
        const task = downloadStore.tasks.find(t => t.id === taskId)
        if (task?.tempFilePath) {
          try {
            await (window as any).electronAPI.deleteFile?.(task.tempFilePath)
          } catch (error) {
            console.error('删除未完成文件失败:', error)
          }
        }
        downloadStore.cancelTask(taskId)
      } else {
        throw new Error(result.error || '下载失败')
      }
    } catch (error: any) {
      // 如果是取消错误，删除未完成的文件
      if (error?.name === 'AbortError' || error?.message?.includes('取消')) {
        const task = downloadStore.tasks.find(t => t.id === taskId)
        if (task?.tempFilePath) {
          try {
            await (window as any).electronAPI.deleteFile?.(task.tempFilePath)
          } catch (deleteError) {
            console.error('删除未完成文件失败:', deleteError)
          }
        }
        downloadStore.cancelTask(taskId)
      } else {
        throw error
      }
    }
  }

  // Web 环境下载（使用 fetch）
  async function downloadWithWeb(
    song: Song,
    quality: QualityType,
    filename: string,
    taskId: string
  ) {
    // 创建 AbortController 用于取消下载
    const controller = new AbortController()
    webDownloadControllers.set(taskId, controller)

    try {
      // 获取下载 URL
      let urlResponse
      try {
        urlResponse = await getSongUrl(song.id, song.source, quality === 'flac' ? '999' : quality)
      } catch (error: any) {
        // 如果是限流错误，给出更明确的提示
        if (error?.message?.includes('接口调用过于频繁') || error?.message?.includes('请等待')) {
          throw new Error(`获取下载链接失败：${error.message}（重试时不会发送网络请求，因为已被限流器阻止）`)
        }
        throw error
      }
      
      const musicUrl = urlResponse?.data?.url || urlResponse?.data?.data?.url
      
      if (!musicUrl) {
        throw new Error('无法获取下载链接：接口返回的URL为空')
      }

      // 开始下载
      const response = await fetch(musicUrl, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`)
      }

      const totalLength = parseInt(response.headers.get('content-length') || '0', 10)
      const reader = response.body?.getReader()
      
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      // 创建 Blob 用于下载
      const chunks: Uint8Array[] = []
      let downloadedLength = 0
      let lastUpdateTime = Date.now()
      let lastDownloadedLength = 0

      // 读取数据流
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        chunks.push(value)
        downloadedLength += value.length

        // 更新进度（每0.5秒更新一次）
        const now = Date.now()
        const timeDelta = (now - lastUpdateTime) / 1000 // 秒
        
        if (timeDelta >= 0.5) {
          const speed = (downloadedLength - lastDownloadedLength) / timeDelta // 字节/秒
          lastDownloadedLength = downloadedLength
          lastUpdateTime = now
          
          if (totalLength > 0) {
            const progress = (downloadedLength / totalLength) * 100
            downloadStore.updateTaskProgress(taskId, progress, {
              speed: speed,
              downloaded: downloadedLength,
              total: totalLength
            })
          } else {
            // 如果没有总长度，使用已下载大小估算进度
            downloadStore.updateTaskProgress(taskId, 50, {
              speed: speed,
              downloaded: downloadedLength
            })
          }
        }
      }

      // 合并所有 chunks 为 Blob
      const blob = new Blob(chunks)
      const blobUrl = URL.createObjectURL(blob)

      // 生成唯一的文件名（避免冲突）
      const ext = quality === 'flac' ? 'flac' : 'mp3'
      const uniqueFilename = getUniqueFilenameForWeb(filename, ext)

      // 触发下载
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = uniqueFilename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 释放 blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100)

      // 完成下载
      downloadStore.updateTaskProgress(taskId, 100)
      downloadStore.completeTask(taskId, filename)
      
      // 显示下载完成通知
      const artistName = normalizeArtistField(song.artist)
      showDownloadNotification(`${artistName}-${song.name}`, true)
      
      // 清理控制器
      webDownloadControllers.delete(taskId)
    } catch (error: any) {
      webDownloadControllers.delete(taskId)
      throw error
    }
  }

  // 暂停下载
  function pauseDownload(taskId: string) {
    const task = downloadStore.tasks.find(t => t.id === taskId)
    if (!task || task.status !== 'downloading') {
      return
    }

    if ((window as any).electronAPI) {
      // Electron 环境：通过 IPC 暂停
      // TODO: 实现 Electron 暂停功能
      downloadStore.pauseTask(taskId)
    } else {
      // Web 环境：先标记为暂停，然后取消当前下载
      // 先标记为暂停，这样 catch 块中检测到 paused 状态时不会调用 cancelTask
      downloadStore.pauseTask(taskId)
      // 然后取消下载
      const controller = webDownloadControllers.get(taskId)
      if (controller) {
        controller.abort()
        webDownloadControllers.delete(taskId)
      }
    }
  }

  // 继续下载
  async function resumeDownload(taskId: string) {
    const task = downloadStore.tasks.find(t => t.id === taskId)
    if (!task || task.status !== 'paused') {
      return
    }

    if ((window as any).electronAPI) {
      // Electron 环境：通过 IPC 继续
      // TODO: 实现 Electron 继续功能
      downloadStore.resumeTask(taskId)
    } else {
      // Web 环境：重新开始下载（从开始，因为无法断点续传）
      // 先恢复状态为下载中
      downloadStore.resumeTask(taskId)
      // 重置进度和速度信息
      downloadStore.updateTaskProgress(taskId, 0)
      // 确保清理旧的控制器（如果有）
      const oldController = webDownloadControllers.get(taskId)
      if (oldController) {
        oldController.abort()
        webDownloadControllers.delete(taskId)
      }
      // 直接调用下载函数，复用现有任务ID
      try {
        const resumedArtist = sanitizeFilenameSegment(normalizeArtistField(task.song.artist), '未知艺术家')
        const resumedSongName = sanitizeFilenameSegment(task.song.name, '未知歌曲')
        await downloadWithWeb(task.song, task.quality, `${resumedArtist}-${resumedSongName}`, taskId)
      } catch (error: any) {
        // 检查任务状态，如果是暂停或取消，不显示错误
        const currentTask = downloadStore.tasks.find(t => t.id === taskId)
        if (currentTask?.status === 'paused' || currentTask?.status === 'cancelled') {
          return
        }
        if (error?.name !== 'AbortError' && !error?.message?.includes('取消')) {
          downloadStore.failTask(taskId, error?.message || '下载失败，请稍后重试')
          const artistName = normalizeArtistField(task.song.artist)
          showDownloadNotification(`${artistName}-${task.song.name}下载失败`, false, error?.message || '下载失败')
        }
      }
    }
  }

  // 取消下载
  async function cancelDownload(taskId: string) {
    const task = downloadStore.tasks.find(t => t.id === taskId)
    if (!task) return

    // 从并发下载控制器中移除任务
    const concurrentTaskId = `${task.song.id}-${task.song.source}-${task.quality}`
    concurrentDownloadController.removeTask(concurrentTaskId)

    if ((window as any).electronAPI) {
      // Electron 环境：通过 IPC 取消并删除未完成的文件
      try {
        await (window as any).electronAPI.cancelDownload?.(taskId)
        // 删除未完成的文件
        if (task.tempFilePath) {
          await (window as any).electronAPI.deleteFile?.(task.tempFilePath)
        }
      } catch (error) {
        console.error('取消下载失败:', error)
      }
      downloadStore.cancelTask(taskId)
    } else {
      // Web 环境：使用 AbortController 取消
      const controller = webDownloadControllers.get(taskId)
      if (controller) {
        controller.abort()
        webDownloadControllers.delete(taskId)
      }
      downloadStore.cancelTask(taskId)
    }
  }

  // 取消所有正在进行的下载（应用关闭时调用）
  async function cancelAllDownloads() {
    const activeTasks = downloadStore.activeTasks.filter(
      t => t.status === 'downloading' || t.status === 'pending'
    )

    for (const task of activeTasks) {
      await cancelDownload(task.id)
    }
  }

  // 重新下载
  async function retryDownload(task: any) {
    // 从并发下载控制器中移除旧任务（如果存在）
    const concurrentTaskId = `${task.song.id}-${task.song.source}-${task.quality}`
    concurrentDownloadController.removeTask(concurrentTaskId)
    
    // 移除旧任务
    downloadStore.removeTask(task.id)
    
    // 确保旧任务已完全移除（等待一个 tick）
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // 重新下载
    await downloadSong(task.song, task.quality)
  }

  // 显示下载通知
  function showDownloadNotification(songName: string, success: boolean, error?: string) {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      return
    }

    // 请求通知权限
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // 显示通知
    if (Notification.permission === 'granted') {
      const title = success ? '下载完成' : '下载失败'
      const body = success 
        ? `${songName} 已下载完成`
        : `${songName} 下载失败${error ? `: ${error}` : ''}`
      
      const notification = new Notification(title, {
        body,
        icon: success ? undefined : undefined, // 可以添加图标
        tag: `download-${Date.now()}`, // 避免重复通知
        requireInteraction: false
      })

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 3秒后自动关闭
      setTimeout(() => {
        notification.close()
      }, 3000)
    }
  }

  function triggerDownloadAnimation(sourceElement: HTMLElement, _taskId: string) {
    // 获取源元素的位置
    const rect = sourceElement.getBoundingClientRect()
    
    // 创建动画元素（只克隆可见内容，不包含按钮）
    const clone = document.createElement('div')
    clone.style.position = 'fixed'
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.zIndex = '999999'
    clone.style.pointerEvents = 'none'
    clone.style.opacity = '0.9'
    clone.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    clone.style.transformOrigin = 'center center'
    clone.style.backgroundColor = 'rgba(46, 204, 113, 0.2)'
    clone.style.border = '2px solid #2ecc71'
    clone.style.borderRadius = '12px'
    clone.style.display = 'flex'
    clone.style.alignItems = 'center'
    clone.style.justifyContent = 'center'
    clone.style.fontSize = '14px'
    clone.style.color = '#2ecc71'
    clone.style.fontWeight = '600'
    
    // 添加下载图标
    const icon = document.createElement('i')
    icon.className = 'fas fa-download'
    icon.style.marginRight = '8px'
    clone.appendChild(icon)
    
    // 添加文本
    const text = document.createElement('span')
    text.textContent = '下载中...'
    clone.appendChild(text)
    
    document.body.appendChild(clone)

    // 获取目标位置（下载列表图标位置）
    // 使用双重 requestAnimationFrame 确保 DOM 已完全渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 尝试多种选择器来找到下载按钮
        let downloadButton = document.querySelector('[data-download-list-button]') as HTMLElement
        if (!downloadButton) {
          // 备用选择器：查找包含"下载"文本的按钮
          const buttons = Array.from(document.querySelectorAll('button'))
          downloadButton = buttons.find(btn => 
            btn.textContent?.includes('下载') || btn.querySelector('.fa-download')
          ) as HTMLElement
        }
        
        if (downloadButton) {
          const targetRect = downloadButton.getBoundingClientRect()
          const targetX = targetRect.left + targetRect.width / 2
          const targetY = targetRect.top + targetRect.height / 2
          
          // 计算动画路径
          const startX = rect.left + rect.width / 2
          const startY = rect.top + rect.height / 2
          const deltaX = targetX - startX
          const deltaY = targetY - startY
          
          // 应用动画
          clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`
          clone.style.opacity = '0'
          
          // 动画结束后移除元素
          setTimeout(() => {
            if (clone.parentNode) {
              clone.parentNode.removeChild(clone)
            }
          }, 600)
        } else {
          // 如果找不到目标，向上移动并淡出
          clone.style.transform = `translate(0, -100px) scale(0.3)`
          clone.style.opacity = '0'
          setTimeout(() => {
            if (clone.parentNode) {
              clone.parentNode.removeChild(clone)
            }
          }, 600)
        }
      })
    })
  }

  /**
   * 批量下载歌曲
   * @param songs 要下载的歌曲列表
   * @param quality 音质
   * @param sourceElements 可选的源元素数组（用于动画，单个下载时使用）
   * @param batchSourceElement 可选的批量下载按钮元素（用于批量下载动画，如果提供则只触发一个动画）
   */
  async function downloadSongs(
    songs: Song[],
    quality: QualityType = '320',
    sourceElements?: (HTMLElement | undefined)[],
    batchSourceElement?: HTMLElement
  ) {
    if (songs.length === 0) {
      showNotification('没有可下载的歌曲', 'warning')
      return
    }

    // 第一步：先为所有歌曲添加下载任务（状态为pending）
    const taskMap = new Map<number, string | null>() // 索引 -> taskId
    let addedCount = 0
    let skippedCount = 0

    songs.forEach((song, index) => {
      const taskId = downloadStore.addDownloadTask(song, quality)
      taskMap.set(index, taskId)
      if (taskId === null) {
        skippedCount++
      } else {
        addedCount++
      }
    })

    // 显示添加结果
    if (skippedCount > 0) {
      showNotification(`已添加 ${addedCount} 首到下载列表，${skippedCount} 首已存在`, 'info')
    } else {
      showNotification(`已添加 ${addedCount} 首到下载列表`, 'info')
    }

    // 第二步：触发动画
    // 如果提供了批量下载按钮，只从该按钮触发一个动画
    // 否则，为每个歌曲的下载按钮触发动画（单个下载时使用）
    if (batchSourceElement) {
      // 批量下载：只触发一个动画
      const firstTaskId = Array.from(taskMap.values()).find(id => id !== null)
      if (firstTaskId) {
        requestAnimationFrame(() => {
          triggerDownloadAnimation(batchSourceElement, firstTaskId)
        })
      }
    } else {
      // 单个下载：为每个任务触发动画
      songs.forEach((_song, index) => {
        const taskId = taskMap.get(index)
        if (taskId === null || taskId === undefined) {
          // 跳过已存在的任务
          return
        }

        const sourceElement = sourceElements?.[index]
        // 立即触发动画（不等待下载开始）
        if (sourceElement) {
          requestAnimationFrame(() => {
            triggerDownloadAnimation(sourceElement, taskId)
          })
        }
      })
    }

    // 第三步：使用并发控制器管理实际下载
    // 只处理成功添加的任务
    const taskInfoList: Array<{ taskId: string; song: Song; promise: Promise<void> }> = []

    songs.forEach((song, index) => {
      const taskId = taskMap.get(index)
      if (taskId === null || taskId === undefined) {
        // 跳过已存在的任务
        return
      }

      // 使用歌曲的唯一标识作为任务ID（用于并发控制）
      const concurrentTaskId = `${song.id}-${song.source}-${quality}`
      
      // 使用并发控制器管理下载
      const promise = concurrentDownloadController.addTask(
        concurrentTaskId,
        async () => {
          // 执行下载（限流已在apiRequest中处理）
          // 注意：动画已在上面触发，这里不再触发
          await executeDownload(song, quality, taskId, undefined)
        }
      )
      
      taskInfoList.push({ taskId, song, promise })
    })

    // 如果是批量下载（有 batchSourceElement），等待所有下载完成并显示统计
    if (batchSourceElement && taskInfoList.length > 0) {
      // 后台等待所有下载完成
      Promise.allSettled(taskInfoList.map(t => t.promise)).then((results) => {
        // 统计成功和失败的数量
        let successCount = 0
        let failedCount = 0
        let cancelledCount = 0

        results.forEach((result, index) => {
          const { taskId } = taskInfoList[index]
          const task = downloadStore.tasks.find(t => t.id === taskId)
          
          if (result.status === 'fulfilled') {
            // Promise 成功完成，检查任务状态
            if (task) {
              if (task.status === 'completed') {
                successCount++
              } else if (task.status === 'failed') {
                failedCount++
              } else if (task.status === 'cancelled') {
                cancelledCount++
              }
            } else {
              // 任务已被移除，可能是成功完成后被清理
              // 这里假设为成功（因为如果失败，任务通常还在列表中）
              successCount++
            }
          } else {
            // Promise 被拒绝，检查任务状态
            if (task) {
              if (task.status === 'failed') {
                failedCount++
              } else if (task.status === 'cancelled') {
                cancelledCount++
              } else {
                // 其他状态，可能是取消
                failedCount++
              }
            } else {
              failedCount++
            }
          }
        })

        // 显示统计通知
        const total = taskInfoList.length
        const parts: string[] = []
        if (successCount > 0) {
          parts.push(`成功 ${successCount}`)
        }
        if (failedCount > 0) {
          parts.push(`失败 ${failedCount}`)
        }
        if (cancelledCount > 0) {
          parts.push(`取消 ${cancelledCount}`)
        }

        if (parts.length > 0) {
          const message = `批量下载完成：${parts.join('，')}（共 ${total} 首）`
          const type = failedCount > 0 ? 'warning' : 'success'
          showNotification(message, type)
        }
      })
    }
    // 如果不是批量下载，不等待完成，让它们后台执行
    // 并发控制器会自动管理队列，超过限制的任务会保持pending状态，显示"等待中"
  }

  return {
    downloadSong,
    downloadSongs,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    cancelAllDownloads,
  }
}

