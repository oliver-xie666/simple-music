import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Song, MusicSource } from '../types'
import { searchMusic as searchMusicApi } from '@/api'

export const useSearchStore = defineStore('search', () => {
  // ... (state properties remain the same)

  // Actions
  async function search(keyword?: string, page = 1) {
    const searchKeyword = keyword || query.value
    if (!searchKeyword.trim()) {
      return
    }

    query.value = searchKeyword
    currentPage.value = page
    isLoading.value = true

    try {
      const response = await searchMusicApi(
        searchKeyword,
        currentSource.value,
        page,
        100 // Default count is now 100
      )

      if (response &&response.data) {
        const songs = parseSongs(response.data, currentSource.value)
        results.value = songs
        
        if (response.data.total) {
          totalPages.value = Math.ceil(response.data.total / 100)
        }
      }
    } catch (error) {
      console.error('搜索失败:', error)
      results.value = []
    } finally {
      isLoading.value = false
    }
  }

  // ... (other actions remain the same)

  return {
    // ...
  }
})

// 解析 API 返回的歌曲数据
function parseSongs(data: any, source: MusicSource): Song[] {
  try {
    // 根据实际 API 返回格式解析
    if (Array.isArray(data)) {
      return data.map((item: any) => parseSong(item, source))
    }
    
    if (data.songs && Array.isArray(data.songs)) {
      return data.songs.map((item: any) => parseSong(item, source))
    }

    return []
  } catch (error) {
    console.error('解析歌曲数据失败:', error)
    return []
  }
}

function parseSong(item: any, source: MusicSource): Song {
  return {
    id: String(item.id || item.songid || item.song_id),
    name: item.name || item.songname || item.song_name || '未知歌曲',
    artist: item.artist || item.singer || item.ar?.[0]?.name || '未知艺术家',
    album: item.album || item.albumname || item.al?.name || '未知专辑',
    cover: item.pic || item.cover || item.al?.picUrl || '',
    duration: parseInt(item.duration || item.time || item.dt || 0) / 1000,
    source,
  }
}

