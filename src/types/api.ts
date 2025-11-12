import type { MusicSource, QualityType } from './music'

// API 请求参数
export interface SearchParams {
  keyword: string
  source: MusicSource
  page?: number
}

export interface FetchUrlParams {
  id: string
  source: MusicSource
  quality?: QualityType
}

export interface FetchLyricsParams {
  id: string
  source: MusicSource
}

// API 响应
export interface ApiResponse<T = any> {
  code?: number
  data?: T
  error?: string
  message?: string
}

