import { contextBridge, ipcRenderer } from 'electron'

/**
 * Electron API 暴露
 * 
 * 注意：普通 API（搜索、获取 URL、歌词、封面等）现在都使用前端 API（直接 HTTP 请求）
 * 这里只暴露差异化处理需要的 API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // 下载音乐（默认保存到文档/music文件夹）
  downloadMusic: (
    params: any, 
    progressCallback?: (progress: number | { progress: number; speed?: number; downloaded?: number; total?: number }) => void
  ) => {
    // 设置任务ID用于进度回调
    const taskId = params.taskId || `${params.id}-${Date.now()}`
    const paramsWithTaskId = { ...params, taskId }
    
    // 如果有进度回调，监听进度事件
    if (progressCallback) {
      const progressHandler = (_event: any, data: { 
        taskId: string
        progress: number
        speed?: number
        downloaded?: number
        total?: number
      }) => {
        if (data.taskId === taskId) {
          // 如果有额外数据，传递对象；否则只传递进度数字
          if (data.speed !== undefined || data.downloaded !== undefined || data.total !== undefined) {
            progressCallback({
              progress: data.progress,
              speed: data.speed,
              downloaded: data.downloaded,
              total: data.total
            })
          } else {
            progressCallback(data.progress)
          }
        }
      }
      ipcRenderer.on('download-progress', progressHandler)
      
      // 下载完成后移除监听器
      const promise = ipcRenderer.invoke('download-music', paramsWithTaskId)
      promise.then(() => {
        ipcRenderer.removeListener('download-progress', progressHandler)
      }).catch(() => {
        ipcRenderer.removeListener('download-progress', progressHandler)
      })
      
      return promise
    }
    
    return ipcRenderer.invoke('download-music', paramsWithTaskId)
  },
  
  // 封面取色（可选，前端已实现，保留作为备选）
  extractPalette: (imageUrl: string) => ipcRenderer.invoke('extract-palette', imageUrl),
  
  // 导入导出（需要文件对话框）
  importJson: () => ipcRenderer.invoke('import-json'),
  exportJson: (params: any) => ipcRenderer.invoke('export-json', params),
  
  // 本地存储（Electron 使用文件系统）
  saveData: (key: string, data: any) => ipcRenderer.invoke('save-data', key, data),
  loadData: (key: string) => ipcRenderer.invoke('load-data', key),
  removeData: (key: string) => ipcRenderer.invoke('remove-data', key),
  
  // 文件对话框
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  
  // 打开文件位置
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('show-item-in-folder', filePath),
  
  // 取消下载
  cancelDownload: (taskId: string) => ipcRenderer.invoke('cancel-download', taskId),
  
  // 删除文件
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  
  // 监听主进程消息
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  }
})
