/**
 * API 核心实现（内部使用）
 * 这些函数是实际的 API 调用实现
 */

import { apiRequest, ApiRequestParams } from './request'
import type { AxiosResponse } from 'axios'

/**
 * 搜索音乐（核心实现）
 */
export const searchMusic = (
  keyword: string,
  source: string,
  page: number = 1,
  count: number = 20
): Promise<AxiosResponse> => {
  const params: ApiRequestParams = {
    types: 'search',
    source,
    name: keyword,
    count: count.toString(),
    pages: page.toString()
  }
  return apiRequest(params)
}

/**
 * 获取歌曲 URL（核心实现）
 */
export const getSongUrl = (
  songId: string,
  source: string,
  quality: string = '320'
): Promise<AxiosResponse> => {
  const params: ApiRequestParams = {
    types: 'url',
    id: songId,
    source,
    br: quality
  }
  return apiRequest(params)
}

/**
 * 获取歌词（核心实现）
 */
export const getLyric = (
  songId: string,
  source: string = 'netease'
): Promise<AxiosResponse> => {
  const params: ApiRequestParams = {
    types: 'lyric',
    id: songId,
    source
  }
  return apiRequest(params)
}

/**
 * 获取封面 URL（核心实现）
 */
export const getPicUrl = async (
  picId: string,
  source: string = 'netease',
  size: number = 300
): Promise<string> => {
  if (!picId) return ''

  const params: ApiRequestParams = {
    types: 'pic',
    id: picId,
    source,
    size: size.toString()
  }

  try {
    const response = await apiRequest(params)
    const data = response?.data

    if (typeof data === 'string') {
      return data
    }

    if (data && typeof data.url === 'string') {
      return data.url
    }

    return ''
  } catch (error) {
    console.error('[API] 获取封面失败:', error)
    return ''
  }
}

/**
 * 获取歌单（核心实现）
 */
export const getPlaylist = (
  playlistId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AxiosResponse> => {
  const params: ApiRequestParams = {
    types: 'playlist',
    id: playlistId,
    limit: limit.toString(),
    offset: offset.toString()
  }
  return apiRequest(params)
}

