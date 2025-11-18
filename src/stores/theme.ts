import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { extractPalette } from '../api'
import { saveData, loadData } from '../api'

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

  const currentGradient = ref('linear-gradient(140deg, #e0f5e9 0%, #c6f0e0 35%, #a3e4d7 100%)')

  // Getters
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
      const palette = await extractPalette(coverUrl)
      
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
    // const root = document.documentElement
    
    // // 应用主题色
    // root.style.setProperty('--primary-color', primaryColor.value)
    
    // // 应用渐变
    // const gradient = isDark.value ? gradients.value.dark : gradients.value.light
    // root.style.setProperty('--gradient-bg', gradient.gradient)
    
    // // 更新 body 类名
    // if (isDark.value) {
    //   document.body.classList.add('dark-theme')
    // } else {
    //   document.body.classList.remove('dark-theme')
    // }
    if (isDark.value) {
      currentGradient.value = 'linear-gradient(135deg, #0b1d1b 0%, #0f2f2c 45%, #123c36 100%)'
    } else {
      currentGradient.value = 'linear-gradient(140deg, #e0f5e9 0%, #c6f0e0 35%, #a3e4d7 100%)'
    }
  }

  // 保存到本地存储
  async function saveToStorage() {
    await saveData('theme', {
      isDark: isDark.value,
      primaryColor: primaryColor.value,
      gradients: gradients.value,
    })
  }

  // 从本地存储加载
  async function loadFromStorage() {
    try {
      const data = await loadData('theme')
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

