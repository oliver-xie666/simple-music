import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Song, MusicSource } from '../types'

export const useSearchStore = defineStore('search', () => {
  // State
  const query = ref('')
  const results = ref<Song[]>([])
  const currentSource = ref<MusicSource>('netease')
  const isLoading = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const selectedSongs = ref<Set<string>>(new Set())

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
      const response = await window.electronAPI.searchMusic({
        keyword: searchKeyword,
        source: currentSource.value,
        page,
      })

      if (response && response.data) {
        // 解析响应数据 - 根据实际 API 返回格式调整
        const songs = parseSongs(response.data, currentSource.value)
        results.value = songs
        
        // 更新总页数
        if (response.data.total) {
          totalPages.value = Math.ceil(response.data.total / 30)
        }
      }
    } catch (error) {
      console.error('搜索失败:', error)
      results.value = []
    } finally {
      isLoading.value = false
    }
  }

  function setSource(source: MusicSource) {
    currentSource.value = source
    // 切换数据源后，如果有查询词，重新搜索
    if (query.value) {
      search()
    }
  }

  function clearResults() {
    results.value = []
    query.value = ''
    currentPage.value = 1
    selectedSongs.value.clear()
  }

  function toggleSelection(songId: string) {
    if (selectedSongs.value.has(songId)) {
      selectedSongs.value.delete(songId)
    } else {
      selectedSongs.value.add(songId)
    }
  }

  function clearSelection() {
    selectedSongs.value.clear()
  }

  function getSelectedSongs(): Song[] {
    return results.value.filter(song => 
      selectedSongs.value.has(`${song.id}-${song.source}`)
    )
  }

  return {
    // State
    query,
    results,
    currentSource,
    isLoading,
    currentPage,
    totalPages,
    selectedSongs,
    // Actions
    search,
    setSource,
    clearResults,
    toggleSelection,
    clearSelection,
    getSelectedSongs,
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

