import { apiRequest, ApiRequestParams } from './api-request'

/**
 * Electron 主进程 API
 * 
 * 注意：普通 API（搜索、获取 URL、歌词、封面等）
 * 
 * 保留的功能：
 * - downloadMusic 中需要获取歌曲 URL（用于下载）
 */

/**
 * 获取歌曲 URL（仅用于下载功能）
 * @param songId 歌曲 ID
 * @param source 音乐源
 * @param quality 音质
 */
export async function getSongUrl(
  songId: string,
  source: string = 'netease',
  quality: string = '320'
) {
  const params: ApiRequestParams = {
    types: 'url',
    id: songId,
    source,
    br: quality
  }
  
  try {
    const response = await apiRequest(params)
    return response.data
  } catch (error: any) {
    console.error('获取URL失败:', error.message)
    // 如果是限流错误，给出更明确的提示
    if (error?.message?.includes('接口调用过于频繁') || error?.message?.includes('请等待')) {
      throw new Error(`获取下载链接失败：${error.message}（重试时不会发送网络请求，因为已被限流器阻止）`)
    }
    throw error
  }
}
