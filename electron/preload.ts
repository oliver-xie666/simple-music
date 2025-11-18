import { contextBridge, ipcRenderer } from 'electron'

/**
 * Electron API 暴露
 * 
 * 注意：普通 API（搜索、获取 URL、歌词、封面等）现在都使用前端 API（直接 HTTP 请求）
 * 这里只暴露差异化处理需要的 API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // 下载音乐（需要文件对话框选择保存位置）
  downloadMusic: (params: any) => ipcRenderer.invoke('download-music', params),
  
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
  
  // 监听主进程消息
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  }
})
