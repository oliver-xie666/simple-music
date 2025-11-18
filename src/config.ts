/**
 * 环境配置
 * 环境检测和配置相关
 */

/**
 * 检测是否在 Electron 环境中
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
}

/**
 * 检测是否在 Web 环境中
 */
export const isWeb = (): boolean => {
  return !isElectron()
}

