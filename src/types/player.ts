import type { Song, PlayMode, QualityType } from './music'

// 播放器状态
export interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playMode: PlayMode
  quality: QualityType
  isLoading: boolean
}

// 播放列表状态
export interface PlaylistState {
  songs: Song[]
  currentIndex: number
}

// 收藏列表状态
export interface FavoritesState {
  songs: Song[]
}

