import { ipcMain, dialog, shell } from 'electron'
import { getSongUrl } from './api'
import { extractPaletteFromImage } from './palette'
import { saveToStore, loadFromStore, removeFromStore } from './storage'
import axios from 'axios'
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { join, dirname, basename, extname } from 'path'
import { homedir } from 'os'

const streamPipeline = promisify(pipeline)

// 存储正在进行的下载任务（用于取消）
const activeDownloads = new Map<string, {
  abortController: AbortController
  tempFilePath: string
}>()

/**
 * 生成唯一的文件名，如果文件已存在则添加序号
 * @param filePath 原始文件路径
 * @returns 唯一的文件路径
 */
function getUniqueFilePath(filePath: string): string {
  if (!existsSync(filePath)) {
    return filePath
  }

  const dir = dirname(filePath)
  const ext = extname(filePath)
  const baseName = basename(filePath, ext)
  
  let counter = 1
  let newPath: string
  
  do {
    newPath = join(dir, `${baseName}(${counter})${ext}`)
    counter++
  } while (existsSync(newPath) && counter < 1000) // 防止无限循环
  
  return newPath
}

/**
 * 设置 IPC 处理器
 * 
 * 注意：普通 API（搜索、获取 URL、歌词、封面等）现在都使用前端 API（直接 HTTP 请求）
 * 这里只保留差异化处理需要的 IPC 处理器：
 * - download-music: 下载音乐（需要文件对话框选择保存位置）
 * - extract-palette: 提取封面颜色（可选，前端已实现）
 * - save-data/load-data/remove-data: 本地存储（Electron 使用文件系统）
 * - import-json/export-json: 导入导出（需要文件对话框）
 * - show-open-dialog/show-save-dialog: 文件对话框
 */
export function setupIpcHandlers() {
  // 获取默认下载目录（文档/music）
  function getDefaultDownloadPath(): string {
    const platform = process.platform
    let documentsPath: string
    
    if (platform === 'win32') {
      // Windows: 使用用户文档目录
      documentsPath = join(homedir(), 'Documents')
    } else if (platform === 'darwin') {
      // macOS: 使用用户文档目录
      documentsPath = join(homedir(), 'Documents')
    } else {
      // Linux: 使用用户文档目录
      documentsPath = join(homedir(), 'Documents')
    }
    
    const musicPath = join(documentsPath, 'music')
    
    // 确保目录存在
    if (!existsSync(musicPath)) {
      mkdirSync(musicPath, { recursive: true })
    }
    
    return musicPath
  }

  // 下载音乐
  ipcMain.handle('download-music', async (event, params) => {
    const abortController = new AbortController()
    let tempFilePath = ''
    
    try {
      const { id, source, quality, filename, taskId } = params
      console.log('IPC 下载:', { id, source, quality, filename, taskId })
      
      // 使用默认下载路径（文档/music文件夹）
      const ext = quality === 'flac' ? 'flac' : 'mp3'
      const downloadDir = getDefaultDownloadPath()
      const originalFilePath = join(downloadDir, `${filename}.${ext}`)
      // 检查文件是否存在，如果存在则添加序号
      const filePath = getUniqueFilePath(originalFilePath)
      tempFilePath = filePath

      // 注册下载任务（用于取消）
      if (taskId) {
        activeDownloads.set(taskId, { abortController, tempFilePath })
      }

      // 发送初始进度（准备下载）
      if (taskId) {
        event.sender.send('download-progress', { 
          taskId, 
          progress: 0,
          tempFilePath: filePath
        })
      }

      // 获取音乐URL
      const urlResult = await getSongUrl(id, source, quality)
      if (!urlResult || !urlResult.url) {
        throw new Error('无法获取下载链接')
      }
      
      const musicUrl = urlResult.url

      // 下载文件（支持进度回调和取消）
      const response = await axios({
        method: 'get',
        url: musicUrl,
        responseType: 'stream',
        timeout: 60000,
        signal: abortController.signal
      })

      const totalLength = parseInt(response.headers['content-length'] || '0', 10)
      let downloadedLength = 0
      let lastUpdateTime = Date.now()
      let lastDownloadedLength = 0

      // 监听数据流以计算进度和速度
      response.data.on('data', (chunk: Buffer) => {
        downloadedLength += chunk.length
        
        const now = Date.now()
        const timeDelta = (now - lastUpdateTime) / 1000 // 秒
        
        if (timeDelta >= 0.5 && taskId) { // 每0.5秒更新一次
          const speed = (downloadedLength - lastDownloadedLength) / timeDelta // 字节/秒
          lastDownloadedLength = downloadedLength
          lastUpdateTime = now
          
          if (totalLength > 0) {
            // 进度从 0% 到 100%（下载阶段）
            const downloadProgress = (downloadedLength / totalLength) * 100
            // 发送进度更新到渲染进程（包含速度和文件大小）
            event.sender.send('download-progress', { 
              taskId, 
              progress: downloadProgress,
              speed: speed, // 字节/秒
              downloaded: downloadedLength,
              total: totalLength,
              tempFilePath: filePath
            })
          }
        }
      })

      await streamPipeline(response.data, createWriteStream(filePath))
      
      // 发送完成进度
      if (taskId) {
        event.sender.send('download-progress', { taskId, progress: 100 })
        // 下载完成，移除任务记录
        activeDownloads.delete(taskId)
      }
      
      return { success: true, path: filePath }
    } catch (error: any) {
      // 如果是取消操作，返回 canceled
      // axios 1.x 中取消请求的错误名称是 'CanceledError' 或 'AbortError'
      const isCanceled = error.name === 'CanceledError' || 
                       error.name === 'AbortError' || 
                       error.code === 'ERR_CANCELED' ||
                       abortController.signal.aborted
      
      if (isCanceled) {
        // 删除未完成的文件
        if (tempFilePath && existsSync(tempFilePath)) {
          try {
            unlinkSync(tempFilePath)
            console.log(`已删除未完成文件: ${tempFilePath}`)
          } catch (deleteError) {
            console.error('删除未完成文件失败:', deleteError)
          }
        }
        if (params.taskId) {
          activeDownloads.delete(params.taskId)
        }
        return { success: false, canceled: true }
      }
      console.error('IPC 下载失败:', error)
      // 下载失败时也删除未完成的文件
      if (tempFilePath && existsSync(tempFilePath)) {
        try {
          unlinkSync(tempFilePath)
        } catch (deleteError) {
          console.error('删除未完成文件失败:', deleteError)
        }
      }
      if (params.taskId) {
        activeDownloads.delete(params.taskId)
      }
      return { success: false, error: error.message || '下载失败' }
    }
  })

  // 取消下载
  ipcMain.handle('cancel-download', async (_event, taskId: string) => {
    const download = activeDownloads.get(taskId)
    if (download) {
      download.abortController.abort()
      // 删除未完成的文件
      if (download.tempFilePath && existsSync(download.tempFilePath)) {
        try {
          unlinkSync(download.tempFilePath)
        } catch (error) {
          console.error('删除未完成文件失败:', error)
        }
      }
      activeDownloads.delete(taskId)
      return { success: true }
    }
    return { success: false, error: '任务不存在或已完成' }
  })

  // 删除文件
  ipcMain.handle('delete-file', async (_event, filePath: string) => {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
        return { success: true }
      }
      return { success: false, error: '文件不存在' }
    } catch (error: any) {
      console.error('删除文件失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 提取封面颜色
  ipcMain.handle('extract-palette', async (_event, imageUrl) => {
    try {
      const palette = await extractPaletteFromImage(imageUrl)
      return { success: true, data: palette }
    } catch (error: any) {
      console.error('IPC 提取颜色失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 本地存储
  ipcMain.handle('save-data', async (_event, key, data) => {
    try {
      await saveToStore(key, data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('load-data', async (_event, key) => {
    try {
      const data = await loadFromStore(key)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('remove-data', async (_event, key) => {
    try {
      await removeFromStore(key)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 导入播放列表/收藏列表
  ipcMain.handle('import-json', async (_event) => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: '导入列表',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      })
      
      if (canceled || filePaths.length === 0) {
        return { success: false, canceled: true }
      }
      
      const fs = require('fs').promises
      const content = await fs.readFile(filePaths[0], 'utf-8')
      const data = JSON.parse(content)
      
      return { success: true, data }
    } catch (error: any) {
      console.error('IPC 导入失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 导出播放列表/收藏列表
  ipcMain.handle('export-json', async (_event, params) => {
    try {
      const { data, defaultName } = params
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: '导出列表',
        defaultPath: defaultName || 'playlist.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })
      
      if (canceled || !filePath) {
        return { success: false, canceled: true }
      }
      
      const fs = require('fs').promises
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
      
      return { success: true, path: filePath }
    } catch (error: any) {
      console.error('IPC 导出失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 文件对话框
  ipcMain.handle('show-open-dialog', async (_event, options) => {
    return dialog.showOpenDialog(options)
  })

  ipcMain.handle('show-save-dialog', async (_event, options) => {
    return dialog.showSaveDialog(options)
  })

  // 打开文件位置
  ipcMain.handle('show-item-in-folder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error: any) {
      console.error('打开文件位置失败:', error)
      return { success: false, error: error.message }
    }
  })
}

/**
 * 取消所有正在进行的下载并删除未完成的文件
 * 应用关闭时调用
 */
export function cancelAllActiveDownloads() {
  for (const [taskId, download] of activeDownloads.entries()) {
    try {
      download.abortController.abort()
      // 删除未完成的文件
      if (download.tempFilePath && existsSync(download.tempFilePath)) {
        unlinkSync(download.tempFilePath)
        console.log(`已删除未完成文件: ${download.tempFilePath}`)
      }
    } catch (error) {
      console.error(`取消下载任务 ${taskId} 失败:`, error)
    }
  }
  activeDownloads.clear()
}
