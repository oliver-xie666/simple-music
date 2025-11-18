/**
 * 搜索相关工具函数
 */
import type { Song, MusicSource } from '../types'
import { getFirstNonEmptyString, normalizeArtistField, normalizeAlbumField } from './song-utils'

/**
 * 解析搜索结果中的歌曲数据
 */
export function parseSearchResult(item: any, source: MusicSource): Song {
  const lyricId = getFirstNonEmptyString(item.lyric_id, item.lyricId, item.id)
  const picId = getFirstNonEmptyString(item.pic_id, item.picId, item.pic_str)
  const urlId = getFirstNonEmptyString(item.url_id, item.urlId)
  const coverUrl = typeof item.pic === 'string' ? item.pic : ''
  const lrcValue = typeof item.lrc === 'string' ? item.lrc : ''

  return {
    id: String(item.id ?? urlId ?? Math.random()),
    name: item.name ?? item.title ?? '未知歌曲',
    artist: normalizeArtistField(item.artist ?? item.author),
    album: normalizeAlbumField(item.album),
    cover: coverUrl,
    picId: picId || undefined,
    url: item.url ?? '',
    urlId: urlId || undefined,
    lrc: lrcValue,
    lyricId: lyricId || undefined,
    duration: Number(item.time ?? item.duration ?? 0) || 0,
    source: item.source ?? source
  } as Song
}

