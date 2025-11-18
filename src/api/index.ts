/**
 * API 统一导出入口
 * 
 * 业务代码应该从这个文件导入 API
 * 所有 API 调用都会自动适配运行环境（Web/Electron）
 */

// 导出配置（环境检测）
export { isElectron, isWeb } from '@/config'

// 导出适配层接口（统一入口）
export {
  // 音乐 API（自动适配环境）
  searchMusic,
  getSongUrl,
  getLyric,
  getPicUrl,
  getPlaylist,
  // 差异化实现 API（Web 和 Electron 都支持）
  downloadMusic,
  extractPalette,
  saveData,
  loadData,
  removeData,
  showOpenDialog,
  showSaveDialog,
  importJson,
  exportJson
} from './adapter'

// 为了向后兼容，也导出核心实现（不推荐直接使用）
export * from './core'
