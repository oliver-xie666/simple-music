import { ipcMain, dialog } from 'electron'
import { searchMusic, getSongUrl, getLyric, getPicUrl } from './api'
import { extractPaletteFromImage } from './palette'
import { saveToStore, loadFromStore, removeFromStore } from './storage'

export function setupIpcHandlers() {
  // 搜索音乐
  ipcMain.handle('search-music', async (_event, params) => {
    try {
      const { keyword, source = 'netease', page = 1 } = params
      console.log('IPC 搜索:', { keyword, source, page })
      const result = await searchMusic(keyword, source, page)
      return { success: true, data: result }
    } catch (error: any) {
      console.error('IPC 搜索失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取音乐 URL
  ipcMain.handle('fetch-music-url', async (_event, params) => {
    try {
      const { id, source = 'netease', quality = '320' } = params
      console.log('IPC 获取URL:', { id, source, quality })
      const result = await getSongUrl(id, source, quality)
      return { success: true, data: result }
    } catch (error: any) {
      console.error('IPC 获取URL失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取歌词
  ipcMain.handle('fetch-lyrics', async (_event, params) => {
    try {
      const { id, source = 'netease' } = params
      const result = await getLyric(id, source)
      return { success: true, data: result }
    } catch (error: any) {
      console.error('IPC 获取歌词失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取封面URL
  ipcMain.handle('get-pic-url', async (_event, params) => {
    try {
      const { picId, source = 'netease' } = params
      const url = getPicUrl(picId, source)
      return { success: true, url }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 下载音乐
  ipcMain.handle('download-music', async (_event, params) => {
    try {
      const { url, filename } = params
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: '保存音乐',
        defaultPath: filename,
        filters: [{ name: 'Audio Files', extensions: ['mp3', 'flac', 'm4a'] }]
      })
      
      if (canceled || !filePath) {
        return { success: false, canceled: true }
      }

      return { success: true, path: filePath }
    } catch (error: any) {
      console.error('IPC 下载失败:', error)
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

  // 文件对话框
  ipcMain.handle('show-open-dialog', async (_event, options) => {
    return dialog.showOpenDialog(options)
  })

  ipcMain.handle('show-save-dialog', async (_event, options) => {
    return dialog.showSaveDialog(options)
  })
}
