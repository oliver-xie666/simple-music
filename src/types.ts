// 类型定义

export type MusicSource = 'netease' | 'kuwo' | 'joox'
export type PlayMode = 'list-loop' | 'single-loop' | 'shuffle'
export type QualityType = '128' | '192' | '320' | 'flac'

export interface Song {
  id: string
  name: string
  artist: string
  album?: string
  cover?: string
  picId?: string
  url: string
  urlId?: string
  resolvedQuality?: QualityType
  lrc?: string
  lyricId?: string
  duration: number
  source: MusicSource
}

export interface LyricLine {
  time: number
  text: string
}
