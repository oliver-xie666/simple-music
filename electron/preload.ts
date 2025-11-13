import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  // 音乐 API
  fetchMusicUrl: (params: any) => ipcRenderer.invoke('fetch-music-url', params),
  searchMusic: (params: any) => ipcRenderer.invoke('search-music', params),
  fetchLyrics: (params: any) => ipcRenderer.invoke('fetch-lyrics', params),
  downloadMusic: (params: any) => ipcRenderer.invoke('download-music', params),
  getPicUrl: (params: any) => ipcRenderer.invoke('get-pic-url', params),
  
  // 封面取色
  extractPalette: (imageUrl: string) => ipcRenderer.invoke('extract-palette', imageUrl),
  
  // 导入导出
  importJson: () => ipcRenderer.invoke('import-json'),
  exportJson: (params: any) => ipcRenderer.invoke('export-json', params),
  
  // 本地存储
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
