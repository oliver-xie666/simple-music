/**
 * 歌词相关工具函数
 */
import type { LyricLine, Song } from '../types'
import { getLyric } from '../api'

/**
 * 解析 LRC 格式歌词
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return []
  const lines = lrcText.split('\n')
  const lyrics: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeRegex))
    if (matches.length === 0) continue
    const text = line.replace(timeRegex, '').trim()
    if (!text) continue

    for (const match of matches) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + milliseconds / 1000
      lyrics.push({ time, text })
    }
  }

  return lyrics.sort((a, b) => a.time - b.time)
}

/**
 * 检查是否是内联歌词内容（包含时间标签）
 */
export function isInlineLyricPayload(content: string): boolean {
  return /\[\d{2}:\d{2}/.test(content)
}

/**
 * 解析歌词文本（从歌曲对象或 API 获取）
 */
export async function resolveLyricText(song: Song): Promise<string> {
  // 1. 检查歌曲对象中是否有歌词
  if (song.lrc) {
    // 如果是 URL，尝试获取
    if (song.lrc.startsWith('http')) {
      try {
        const response = await fetch(song.lrc)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.text()
      } catch (error) {
        // 继续尝试使用 API 获取
      }
    }
    // 如果是内联歌词内容，直接返回
    if (isInlineLyricPayload(song.lrc)) {
      return song.lrc
    }
  }

  // 2. 使用 API 获取歌词
  const lyricId = song.lyricId || song.id
  if (!lyricId) return ''

  const response = await getLyric(lyricId, song.source)
  const data = response?.data

  if (typeof data === 'string') {
    return data
  }

  if (data && typeof data.lyric === 'string') {
    return data.lyric
  }

  if (data && typeof data.lrc === 'string') {
    return data.lrc
  }

  if (data && typeof data.lrc === 'object' && typeof data.lrc?.lyric === 'string') {
    return data.lrc.lyric
  }

  return ''
}

