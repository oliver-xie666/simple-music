/**
 * API 适配层
 * 
 * 统一 API 调用接口，自动检测运行环境（web/electron）并选择最佳调用方式
 * 
 * 策略：
 * - 普通 API（搜索、获取 URL、歌词、封面）：在 Web 和 Electron 中都使用前端 API（直接 HTTP 请求）
 * - 下载、颜色提取、文件对话框、导入导出：Web 和 Electron 都实现，差异化处理
 * - 本地存储：Web 使用 localStorage，Electron 使用文件系统
 */

// 导入核心实现（避免循环导入）
import { 
  searchMusic as searchMusicImpl,
  getSongUrl as getSongUrlImpl,
  getLyric as getLyricImpl,
  getPicUrl as getPicUrlImpl,
  getPlaylist as getPlaylistImpl
} from './core'
import {
  downloadFile,
  extractPaletteFromImage,
  importJson as importJsonWeb,
  exportJson as exportJsonWeb,
  showFileInputDialog
} from '@/utils/web-utils'
import { isElectron } from '@/config'
import type { AxiosResponse } from 'axios'

/**
 * 搜索音乐
 * 在 Electron 和 Web 中都使用前端 API（直接 HTTP 请求）
 */
export const searchMusic = (
  keyword: string,
  source: string,
  page: number = 1,
  count: number = 20
): Promise<AxiosResponse> => {
  return searchMusicImpl(keyword, source, page, count)
}

/**
 * 获取歌曲 URL
 * 在 Electron 和 Web 中都使用前端 API（直接 HTTP 请求）
 */
export const getSongUrl = (
  songId: string,
  source: string,
  quality: string = '320'
): Promise<AxiosResponse> => {
  return getSongUrlImpl(songId, source, quality)
}

/**
 * 获取歌词
 * 在 Web 和 Electron 中都使用前端 API（直接 HTTP 请求）
 */
export const getLyric = (
  songId: string,
  source: string = 'netease'
): Promise<AxiosResponse> => {
  return getLyricImpl(songId, source)
}

/**
 * 获取封面 URL
 * 在 Web 和 Electron 中都使用前端 API（直接 HTTP 请求）
 */
export const getPicUrl = async (
  picId: string,
  source: string = 'netease',
  size: number = 300
): Promise<string> => {
  if (!picId) return ''
  return await getPicUrlImpl(picId, source, size)
}

/**
 * 获取歌单
 * 在 Electron 和 Web 中都使用前端 API（直接 HTTP 请求）
 */
export const getPlaylist = (
  playlistId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AxiosResponse> => {
  return getPlaylistImpl(playlistId, limit, offset)
}

/**
 * 下载音乐
 * Web 和 Electron 都支持，差异化实现
 */
export const downloadMusic = async (params: {
  id: string
  source: string
  quality: string
  filename: string
}): Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }> => {
  // 先获取歌曲 URL
  try {
    const urlResponse = await getSongUrlImpl(params.id, params.source, params.quality)
    const musicUrl = urlResponse?.data?.url || urlResponse?.data?.data?.url
    
    if (!musicUrl) {
      throw new Error('无法获取下载链接')
    }

    const ext = params.quality === 'flac' ? 'flac' : 'mp3'
    const filename = `${params.filename}.${ext}`

    if (isElectron() && window.electronAPI?.downloadMusic) {
      // Electron 环境：使用 IPC（支持文件对话框选择保存位置）
      return await window.electronAPI.downloadMusic(params)
    } else {
      // Web 环境：使用 <a> 标签下载
      const result = await downloadFile(musicUrl, filename)
      return {
        success: result.success,
        error: result.error,
        path: result.success ? filename : undefined
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '下载失败'
    }
  }
}

/**
 * 提取封面颜色
 * Web 和 Electron 都支持，差异化实现
 */
export const extractPalette = async (imageUrl: string): Promise<any> => {
  if (isElectron() && window.electronAPI?.extractPalette) {
    // Electron 环境：优先使用 IPC（可能性能更好）
    try {
      const result = await window.electronAPI.extractPalette(imageUrl)
      if (result?.success) {
        return result.data
      }
    } catch (error) {
      console.warn('[API Adapter] Electron 提取颜色失败，降级到前端实现:', error)
    }
  }
  
  // Web 环境或 Electron 失败时：使用前端实现（Canvas API）
  try {
    const palette = await extractPaletteFromImage(imageUrl)
    palette.source = imageUrl
    return palette
  } catch (error: any) {
    console.error('[API Adapter] 提取颜色失败:', error)
    throw new Error(`颜色提取失败: ${error.message}`)
  }
}

/**
 * 本地存储（Electron 使用文件系统，Web 使用 localStorage）
 */
export const saveData = async (key: string, data: any): Promise<void> => {
  if (isElectron() && window.electronAPI?.saveData) {
    const result = await window.electronAPI.saveData(key, data)
    if (!result?.success) {
      throw new Error(result?.error || '保存失败')
    }
  } else {
    // Web 环境使用 localStorage
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      throw new Error('保存到 localStorage 失败')
    }
  }
}

export const loadData = async <T = any>(key: string): Promise<T | null> => {
  if (isElectron() && window.electronAPI?.loadData) {
    const result = await window.electronAPI.loadData(key)
    if (result?.success) {
      return result.data
    }
    return null
  } else {
    // Web 环境使用 localStorage
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('从 localStorage 加载失败:', error)
      return null
    }
  }
}

export const removeData = async (key: string): Promise<void> => {
  if (isElectron() && window.electronAPI?.removeData) {
    const result = await window.electronAPI.removeData(key)
    if (!result?.success) {
      throw new Error(result?.error || '删除失败')
    }
  } else {
    // Web 环境使用 localStorage
    try {
      localStorage.removeItem(key)
    } catch (error) {
      throw new Error('从 localStorage 删除失败')
    }
  }
}

/**
 * 文件对话框
 * Web 和 Electron 都支持，差异化实现
 */
export const showOpenDialog = async (options: any): Promise<any> => {
  if (isElectron() && window.electronAPI?.showOpenDialog) {
    // Electron 环境：使用原生文件对话框
    return await window.electronAPI.showOpenDialog(options)
  } else {
    // Web 环境：使用 <input type="file">
    const accept = options?.filters?.[0]?.extensions?.map((ext: string) => `.${ext}`).join(',') || '*/*'
    const result = await showFileInputDialog({
      accept,
      multiple: options?.properties?.includes('multiSelections') || false
    })
    
    if (result.canceled || !result.files) {
      return { canceled: true, filePaths: [] }
    }
    
    // 转换为 Electron 格式
    const filePaths: string[] = []
    for (let i = 0; i < result.files.length; i++) {
      // Web 环境无法获取真实路径，返回文件名
      filePaths.push(result.files[i].name)
    }
    
    return { canceled: false, filePaths }
  }
}

export const showSaveDialog = async (options: any): Promise<any> => {
  if (isElectron() && window.electronAPI?.showSaveDialog) {
    // Electron 环境：使用原生保存对话框
    return await window.electronAPI.showSaveDialog(options)
  } else {
    // Web 环境：无法实现保存对话框，返回默认文件名
    // 实际保存需要通过其他方式（如 downloadFile）
    return {
      canceled: false,
      filePath: options?.defaultPath || 'file'
    }
  }
}

/**
 * 导入/导出 JSON
 * Web 和 Electron 都支持，差异化实现
 */
export const importJson = async (): Promise<any> => {
  if (isElectron() && (window.electronAPI as any)?.importJson) {
    // Electron 环境：使用原生文件对话框
    return await (window.electronAPI as any).importJson()
  } else {
    // Web 环境：使用文件输入对话框
    return await importJsonWeb()
  }
}

export const exportJson = async (params: { data: any; defaultName?: string }): Promise<any> => {
  if (isElectron() && (window.electronAPI as any)?.exportJson) {
    // Electron 环境：使用原生保存对话框
    return await (window.electronAPI as any).exportJson(params)
  } else {
    // Web 环境：使用文件下载
    const result = await exportJsonWeb(params)
    if (result.success) {
      return { success: true, path: params.defaultName || 'playlist.json' }
    }
    return result
  }
}

