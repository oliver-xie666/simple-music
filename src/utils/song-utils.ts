/**
 * 歌曲相关工具函数
 */
import type { Song } from '../types'
import { getPicUrl } from '../api'

const ARTIST_DELIMITER = '、'
const FORBIDDEN_FILENAME_CHARS = /[\\/:*?"<>|]/g
const SLASH_CHAR_REGEX = /[\\/]+/g
const MULTIPLE_SPACES_REGEX = /\s+/g

function sanitizeDisplayValue(value: string): string {
  return value
    .replace(SLASH_CHAR_REGEX, ARTIST_DELIMITER)
    .replace(FORBIDDEN_FILENAME_CHARS, '·')
    .replace(MULTIPLE_SPACES_REGEX, ' ')
    .trim()
}

export function sanitizeFilenameSegment(value: string | undefined | null, fallback = '未命名'): string {
  const safeValue = (value ?? '').toString()
  const sanitized = sanitizeDisplayValue(safeValue).replace(/[. ]+$/, '')
  return sanitized || fallback
}

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
      .map(name => sanitizeDisplayValue(name))
      .filter(Boolean)

    return names.length ? names.join(ARTIST_DELIMITER) : '未知艺术家'
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.artist)) return normalizeArtistField(value.artist)
    if (Array.isArray(value.ar)) return normalizeArtistField(value.ar)
    if (Array.isArray((value as any).data)) return normalizeArtistField((value as any).data)

    const displayValue = getFirstNonEmptyString(value.name, value.title, value.artist)
    return displayValue ? sanitizeDisplayValue(displayValue) : '未知艺术家'
  }

  return sanitizeDisplayValue(String(value))
}

/**
 * 规范化专辑字段
 */
export function normalizeAlbumField(value: any): string {
  if (value === undefined || value === null) return '未知专辑'

  if (typeof value === 'object') {
    const result = getFirstNonEmptyString(value.name, value.title, value.album)
    return result ? sanitizeDisplayValue(result) : '未知专辑'
  }

  return sanitizeDisplayValue(String(value))
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
  // 如果已经有封面，直接返回（不需要再调用接口）
  if (song.cover && song.cover.trim().length > 0) {
    console.log('[DEBUG] 歌曲已有封面，跳过 getPicUrl 调用:', { id: song.id, cover: song.cover.substring(0, 50) + '...' })
    return song
  }
  
  // 如果没有 picId，无法获取封面
  if (!song.picId) {
    console.log('[DEBUG] 歌曲没有 picId，无法获取封面:', { id: song.id })
    return song
  }

  try {
    console.log('[DEBUG] 调用 getPicUrl 获取封面:', { picId: song.picId, source: song.source })
    const coverUrl = await getPicUrl(song.picId, song.source)
    if (!coverUrl) {
      console.log('[DEBUG] getPicUrl 返回空，封面获取失败')
      return song
    }
    console.log('[DEBUG] 封面获取成功:', coverUrl.substring(0, 50) + '...')
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

