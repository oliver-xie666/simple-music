/**
 * 歌曲相关工具函数
 */
import type { Song } from '../types'
import { getPicUrl } from '../api'

/**
 * 格式化时间（秒 -> MM:SS）
 */
export function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * 规范化艺术家字段
 */
export function normalizeArtistField(value: any): string {
  if (value === undefined || value === null) return '未知艺术家'

  if (Array.isArray(value)) {
    const names = value
      .map(entry => {
        if (!entry) return ''
        if (typeof entry === 'string') return entry
        if (typeof entry === 'object') {
          return getFirstNonEmptyString(entry.name, entry.title, entry.artist)
        }
        return String(entry)
      })
      .filter(Boolean)

    return names.length ? names.join(' / ') : '未知艺术家'
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.artist)) return normalizeArtistField(value.artist)
    if (Array.isArray(value.ar)) return normalizeArtistField(value.ar)
    if (Array.isArray((value as any).data)) return normalizeArtistField((value as any).data)

    return getFirstNonEmptyString(value.name, value.title, value.artist) || '未知艺术家'
  }

  return String(value)
}

/**
 * 规范化专辑字段
 */
export function normalizeAlbumField(value: any): string {
  if (value === undefined || value === null) return '未知专辑'

  if (typeof value === 'object') {
    return getFirstNonEmptyString(value.name, value.title, value.album) || '未知专辑'
  }

  return String(value)
}

/**
 * 获取第一个非空字符串
 */
export function getFirstNonEmptyString(...values: any[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const str = String(value).trim()
    if (str) return str
  }
  return ''
}

/**
 * 确保歌曲有封面（如果缺失则获取）
 */
export async function ensureSongArtwork(song: Song): Promise<Song> {
  if (song.cover && song.cover.trim().length > 0) {
    return song
  }
  if (!song.picId) return song

  try {
    const coverUrl = await getPicUrl(song.picId, song.source)
    if (!coverUrl) {
      return song
    }
    return { ...song, cover: coverUrl }
  } catch (error) {
    console.error('封面获取失败:', error)
    return song
  }
}

/**
 * 映射音质到 API 值
 */
export function mapQualityToApiValue(targetQuality: '128' | '192' | '320' | 'flac'): string {
  return targetQuality === 'flac' ? '999' : targetQuality
}

