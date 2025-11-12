// 类型定义 - 完全按照 Solara 的数据结构

export type MusicSource = 'netease' | 'qq' | 'kugou' | 'kuwo' | 'joox'
export type PlayMode = 'list-loop' | 'single-loop' | 'shuffle'
export type QualityType = '128' | '192' | '320' | 'flac'

export interface Song {
  id: string
  name: string
  artist: string
  album: string
  cover: string
  pic_id?: string      // Solara API 返回的封面ID
  url_id?: string      // Solara API 返回的URL ID
  lyric_id?: string    // Solara API 返回的歌词ID
  duration: number
  source: MusicSource
  url?: string
}

export interface LyricLine {
  time: number
  text: string
}
