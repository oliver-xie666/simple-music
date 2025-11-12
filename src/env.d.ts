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
      fetchMusicUrl: (params: any) => Promise<any>
      searchMusic: (params: any) => Promise<any>
      fetchLyrics: (params: any) => Promise<any>
      downloadMusic: (params: any) => Promise<any>
      getPicUrl: (params: any) => Promise<any>
      extractPalette: (imageUrl: string) => Promise<any>
      saveData: (key: string, data: any) => Promise<any>
      loadData: (key: string) => Promise<any>
      removeData: (key: string) => Promise<any>
      showOpenDialog: (options: any) => Promise<any>
      showSaveDialog: (options: any) => Promise<any>
      onMainMessage: (callback: (message: string) => void) => void
    }
  }
}

export {}
