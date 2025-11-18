import { useSearchStore } from '../stores/search'
import { usePlaylistStore } from '../stores/playlist'
import { useFavoritesStore } from '../stores/favorites'
import { searchMusic } from '../api'
import { parseSearchResult } from '../utils/search-utils'
import { useNotification } from './useNotification'

export function useSearch() {
  const searchStore = useSearchStore()
  const playlistStore = usePlaylistStore()
  const favoritesStore = useFavoritesStore()
  const { show: showNotification } = useNotification()

  /**
   * 执行搜索
   */
  async function search(keyword: string, page: number = 1, append: boolean = false) {
    if (!keyword.trim()) {
      showNotification('请输入搜索关键字', 'error')
      return
    }
    if (!append) {
      searchStore.query = keyword
      searchStore.currentPage = page
      searchStore.selectedIndices.clear()
    }

    try {
      const response = await searchMusic(keyword, searchStore.currentSource, page, searchStore.limit)
      
      const data = response?.data
      
      if (Array.isArray(data)) {
        const newResults = data.map((item: any) => parseSearchResult(item, searchStore.currentSource))
        
        if (append) {
          searchStore.results = [...searchStore.results, ...newResults]
        } else {
          searchStore.results = newResults
        }
      } else {
        console.error('[搜索] 搜索结果格式错误:', data)
        showNotification('搜索结果格式错误', 'error')
      }
    } catch (error: any) {
      console.error('[搜索] 搜索失败:', error)
      showNotification(`搜索失败: ${error?.message || '请稍后重试'}`, 'error')
    }
  }

  /**
   * 加载更多搜索结果
   */
  function loadMoreSearchResults() {
    if (searchStore.isLoading) return
    searchStore.currentPage++
    search(searchStore.query, searchStore.currentPage, true)
  }

  /**
   * 跳转到指定页
   */
  function goToPage(page: number) {
    if (searchStore.isLoading) return
    if (page < 1) return
    search(searchStore.query, page, false)
  }

  /**
   * 设置搜索限制
   */
  function setSearchLimit(limit: number) {
    searchStore.limit = limit
    if (searchStore.query.trim()) {
      search(searchStore.query, searchStore.currentPage, false)
    }
  }

  /**
   * 切换搜索结果选择状态
   */
  function toggleSearchResultSelection(index: number) {
    if (searchStore.selectedIndices.has(index)) {
      searchStore.selectedIndices.delete(index)
    } else {
      searchStore.selectedIndices.add(index)
    }
  }

  /**
   * 清空搜索结果选择
   */
  function clearSearchResultSelection() {
    searchStore.selectedIndices.clear()
  }

  /**
   * 播放所有搜索结果
   */
  async function playAllSearchResults(playAtIndex: (index: number) => Promise<boolean>) {
    if (searchStore.results.length === 0) return
    const startIndex = playlistStore.songs.length
    searchStore.results.forEach(song => playlistStore.addSong(song))
    if (playlistStore.songs.length > startIndex) {
      await playAtIndex(startIndex)
    }
    showNotification(`已添加 ${searchStore.results.length} 首歌曲到播放列表`, 'success')
  }

  /**
   * 导入选中的搜索结果
   */
  function importSelectedSearchResults(target: 'playlist' | 'favorites' = 'playlist') {
    if (searchStore.selectedIndices.size === 0) {
      showNotification('请先选择要导入的歌曲', 'warning')
      return
    }
    
    const indices = Array.from(searchStore.selectedIndices).filter(idx => idx >= 0 && idx < searchStore.results.length)
    const songsToAdd = indices.map(idx => searchStore.results[idx]).filter(Boolean)
    
    if (songsToAdd.length === 0) {
      showNotification('未找到可导入的歌曲', 'warning')
      return
    }
    
    if (target === 'playlist') {
      songsToAdd.forEach(song => playlistStore.addSong(song))
      showNotification(`已导入 ${songsToAdd.length} 首歌曲到播放列表`, 'success')
    } else {
      songsToAdd.forEach(song => favoritesStore.addFavorite(song))
      showNotification(`已导入 ${songsToAdd.length} 首歌曲到收藏列表`, 'success')
    }
    
    searchStore.selectedIndices.clear()
  }

  return {
    search,
    loadMoreSearchResults,
    goToPage,
    setSearchLimit,
    toggleSearchResultSelection,
    clearSearchResultSelection,
    playAllSearchResults,
    importSelectedSearchResults,
  }
}

