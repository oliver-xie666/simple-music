import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { PaletteResponse } from '../../electron/services/palette'

export const useThemeStore = defineStore('theme', () => {
  // State
  const isDark = ref(false)
  const primaryColor = ref('#3498db')
  const gradients = ref({
    light: {
      gradient: 'linear-gradient(140deg, #667eea 0%, #764ba2 100%)',
      colors: ['#667eea', '#764ba2']
    },
    dark: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      colors: ['#667eea', '#764ba2']
    }
  })

  // Getters
  const currentGradient = computed(() => {
    return isDark.value ? gradients.value.dark.gradient : gradients.value.light.gradient
  })

  const currentColors = computed(() => {
    return isDark.value ? gradients.value.dark.colors : gradients.value.light.colors
  })

  // Actions
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
    saveToStorage()
  }

  function setTheme(dark: boolean) {
    isDark.value = dark
    applyTheme()
    saveToStorage()
  }

  async function setThemeFromCover(coverUrl: string) {
    try {
      const palette: PaletteResponse = await window.electronAPI.extractPalette(coverUrl)
      
      if (palette) {
        primaryColor.value = palette.accentColor
        gradients.value = palette.gradients
        applyTheme()
      }
    } catch (error) {
      console.error('提取封面颜色失败:', error)
    }
  }

  function applyTheme() {
    const root = document.documentElement
    
    // 应用主题色
    root.style.setProperty('--primary-color', primaryColor.value)
    
    // 应用渐变
    const gradient = isDark.value ? gradients.value.dark : gradients.value.light
    root.style.setProperty('--gradient-bg', gradient.gradient)
    
    // 更新 body 类名
    if (isDark.value) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }

  // 保存到本地存储
  async function saveToStorage() {
    await window.electronAPI.saveData('theme', {
      isDark: isDark.value,
      primaryColor: primaryColor.value,
      gradients: gradients.value,
    })
  }

  // 从本地存储加载
  async function loadFromStorage() {
    try {
      const data = await window.electronAPI.loadData('theme')
      if (data) {
        isDark.value = data.isDark ?? false
        primaryColor.value = data.primaryColor ?? '#3498db'
        if (data.gradients) {
          gradients.value = data.gradients
        }
        applyTheme()
      } else {
        // 检测系统主题
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark)
      }
    } catch (error) {
      console.error('加载主题设置失败:', error)
    }
  }

  // 监听系统主题变化
  function initSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      setTheme(e.matches)
    })
  }

  return {
    // State
    isDark,
    primaryColor,
    gradients,
    // Getters
    currentGradient,
    currentColors,
    // Actions
    toggleTheme,
    setTheme,
    setThemeFromCover,
    applyTheme,
    saveToStorage,
    loadFromStorage,
    initSystemThemeListener,
  }
})

