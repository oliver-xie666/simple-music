// 音乐来源
export type MusicSource = 'netease' | 'qq' | 'kugou' | 'kuwo' | 'migu'

// 歌曲信息
export interface Song {
  id: string
  name: string
  artist: string
  album: string
  cover: string
  duration: number
  source: MusicSource
  url?: string
  lyric?: string
}

// 歌词行
export interface LyricLine {
  time: number
  text: string
}

// 搜索结果
export interface SearchResult {
  songs: Song[]
  total: number
  page: number
}

// 音质类型
export type QualityType = '128' | '192' | '320' | 'flac'

// 播放模式
export type PlayMode = 'list-loop' | 'single-loop' | 'shuffle'

