import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * 移动端检测和状态管理
 */
export function useMobile() {
  const isMobile = ref(false)
  const isMobileView = ref(false)
  const isSearchOpen = ref(false)
  const isPanelOpen = ref(false)
  const panelView = ref<'playlist' | 'lyrics'>('playlist')
  const isInlineLyricsOpen = ref(false)

  /**
   * 检测是否为移动设备
   */
  function detectMobile(): boolean {
    if (typeof window === 'undefined') return false
    
    const ua = navigator.userAgent || ''
    const isMobileUA = /android|iphone|ipad|ipod|mobile|blackberry|phone|opera mini|windows phone/i.test(ua)
    const isSmallScreen = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 820px)').matches
    
    return isMobileUA || isSmallScreen
  }

  /**
   * 更新移动端状态
   */
  function updateMobileState() {
    const detected = detectMobile()
    isMobile.value = detected
    isMobileView.value = detected
    
    if (detected && typeof document !== 'undefined') {
      document.documentElement.classList.add('mobile-view')
      document.body?.classList.add('mobile-view')
      
      // 设置移动端 CSS 变量
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      if (isPortrait) {
        document.documentElement.style.setProperty('--mobile-ring-inner-radius', 'clamp(260px, 64vw, 480px)')
        document.documentElement.style.setProperty('--mobile-ring-feather', 'clamp(110px, 22vw, 260px)')
        document.documentElement.style.setProperty('--mobile-ring-vertical-shift', 'calc((env(safe-area-inset-top, 0px) * 0.55) - 28px)')
      } else {
        document.documentElement.style.setProperty('--mobile-ring-inner-radius', 'clamp(280px, 70vw, 520px)')
        document.documentElement.style.setProperty('--mobile-ring-feather', 'clamp(120px, 24vw, 280px)')
        document.documentElement.style.setProperty('--mobile-ring-vertical-shift', 'calc((env(safe-area-inset-top, 0px) * 0.5) - 24px)')
      }
    } else if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('mobile-view')
      document.body?.classList.remove('mobile-view')
    }
  }

  /**
   * 设置视口高度变量（用于移动端）
   */
  function setViewportUnit() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    document.documentElement.style.setProperty('--mobile-vh', `${viewportHeight}px`)
  }

  /**
   * 打开搜索
   */
  function openSearch() {
    isSearchOpen.value = true
    isPanelOpen.value = false
    if (typeof document !== 'undefined') {
      document.body?.classList.add('mobile-search-open')
      document.body?.classList.remove('mobile-panel-open')
    }
  }

  /**
   * 关闭搜索
   */
  function closeSearch() {
    isSearchOpen.value = false
    if (typeof document !== 'undefined') {
      document.body?.classList.remove('mobile-search-open')
    }
  }

  /**
   * 切换搜索
   */
  function toggleSearch() {
    if (isSearchOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }

  /**
   * 打开面板
   */
  function openPanel(view: 'playlist' | 'lyrics' = 'playlist') {
    panelView.value = view
    isPanelOpen.value = true
    isSearchOpen.value = false
    if (typeof document !== 'undefined') {
      document.body?.classList.add('mobile-panel-open')
      document.body?.classList.remove('mobile-search-open')
      document.body?.setAttribute('data-mobile-panel-view', view)
    }
  }

  /**
   * 关闭面板
   */
  function closePanel() {
    isPanelOpen.value = false
    if (typeof document !== 'undefined') {
      document.body?.classList.remove('mobile-panel-open')
    }
  }

  /**
   * 切换面板
   */
  function togglePanel(view: 'playlist' | 'lyrics' = 'playlist') {
    const currentView = panelView.value
    const targetView = view || currentView || 'playlist'
    
    if (isPanelOpen.value && currentView === targetView) {
      closePanel()
    } else {
      openPanel(targetView)
    }
  }

  /**
   * 切换内联歌词显示
   */
  function toggleInlineLyrics() {
    isInlineLyricsOpen.value = !isInlineLyricsOpen.value
    if (typeof document !== 'undefined') {
      if (isInlineLyricsOpen.value) {
        document.body?.classList.add('mobile-inline-lyrics-open')
      } else {
        document.body?.classList.remove('mobile-inline-lyrics-open')
      }
    }
  }

  /**
   * 关闭所有覆盖层
   */
  function closeAllOverlays() {
    closeSearch()
    closePanel()
  }

  // 初始化
  onMounted(() => {
    updateMobileState()
    setViewportUnit()
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateMobileState)
    window.addEventListener('resize', setViewportUnit)
    window.addEventListener('orientationchange', setViewportUnit)
    
    // 监听 visualViewport 变化（移动端键盘弹出等）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportUnit)
      window.visualViewport.addEventListener('scroll', setViewportUnit)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateMobileState)
    window.removeEventListener('resize', setViewportUnit)
    window.removeEventListener('orientationchange', setViewportUnit)
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', setViewportUnit)
      window.visualViewport.removeEventListener('scroll', setViewportUnit)
    }
  })

  return {
    isMobile: computed(() => isMobile.value),
    isMobileView: computed(() => isMobileView.value),
    isSearchOpen: computed(() => isSearchOpen.value),
    isPanelOpen: computed(() => isPanelOpen.value),
    panelView: computed(() => panelView.value),
    isInlineLyricsOpen: computed(() => isInlineLyricsOpen.value),
    openSearch,
    closeSearch,
    toggleSearch,
    openPanel,
    closePanel,
    togglePanel,
    toggleInlineLyrics,
    closeAllOverlays,
  }
}

