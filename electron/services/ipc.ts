import { ipcMain, dialog } from 'electron'
import { searchMusic, getSongUrl, getLyric, getPicUrl } from './api'
import { extractPaletteFromImage } from './palette'
import { saveToStore, loadFromStore, removeFromStore } from './storage'
import axios from 'axios'
import { createWriteStream } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'

const streamPipeline = promisify(pipeline)

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
      const { id, source, quality, filename } = params
      console.log('IPC 下载:', { id, source, quality, filename })
      
      // 获取音乐URL
      const urlResult = await getSongUrl(id, source, quality)
      if (!urlResult || !urlResult.url) {
        throw new Error('无法获取下载链接')
      }
      
      const musicUrl = urlResult.url
      
      // 显示保存对话框
      const ext = quality === 'flac' ? 'flac' : 'mp3'
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: '保存音乐',
        defaultPath: `${filename}.${ext}`,
        filters: [{ name: 'Audio Files', extensions: [ext] }]
      })
      
      if (canceled || !filePath) {
        return { success: false, canceled: true }
      }

      // 下载文件
      const response = await axios({
        method: 'get',
        url: musicUrl,
        responseType: 'stream',
        timeout: 60000
      })

      await streamPipeline(response.data, createWriteStream(filePath))
      
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
}
