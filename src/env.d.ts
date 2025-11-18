/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      // 差异化处理 API（普通 API 现在都使用前端 API）
      downloadMusic: (params: any) => Promise<any>
      extractPalette: (imageUrl: string) => Promise<any>
      saveData: (key: string, data: any) => Promise<any>
      loadData: (key: string) => Promise<any>
      removeData: (key: string) => Promise<any>
      showOpenDialog: (options: any) => Promise<any>
      showSaveDialog: (options: any) => Promise<any>
      importJson: () => Promise<any>
      exportJson: (params: any) => Promise<any>
      onMainMessage: (callback: (message: string) => void) => void
    }
  }
}

export {}
