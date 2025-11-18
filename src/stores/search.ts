import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Song, MusicSource } from '../types'
import { searchMusic as searchMusicApi } from '@/api'
import { parseSearchResult } from '../utils/search-utils'

export const useSearchStore = defineStore('search', () => {
  // State
  const query = ref('')
  const results = ref<Song[]>([])
  const currentSource = ref<MusicSource>('netease')
  const isLoading = ref(false)
  const currentPage = ref(1)
  const limit = ref(20)
  const totalPages = ref(0)
  const selectedIndices = ref<Set<number>>(new Set())

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
        limit.value
      )

      if (response?.data) {
        const data = response.data
        if (Array.isArray(data)) {
          results.value = data.map((item: any) => parseSearchResult(item, currentSource.value))
        } else {
          results.value = []
        }
        
        if (response.data.total) {
          totalPages.value = Math.ceil(response.data.total / limit.value)
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
  }

  function setLimit(newLimit: number) {
    limit.value = newLimit
  }

  function clearResults() {
    results.value = []
    query.value = ''
    currentPage.value = 1
    selectedIndices.value.clear()
  }

  return {
    // State
    query,
    results,
    currentSource,
    isLoading,
    currentPage,
    limit,
    totalPages,
    selectedIndices,
    // Actions
    search,
    setSource,
    setLimit,
    clearResults,
  }
})
