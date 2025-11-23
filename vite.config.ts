import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

// 检测是否为 Electron 模式
// 通过环境变量 ELECTRON_MODE 或命令行参数 --mode electron 来判断
const isElectronMode = process.env.ELECTRON_MODE === 'true' || process.env.MODE === 'electron'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    // 只在 Electron 模式下加载 Electron 插件
    ...(isElectronMode ? [
      electron([
        {
          entry: 'electron/main.ts',
          onstart(options) {
            // 启动 Electron 应用
            options.startup()
          },
          vite: {
            build: {
              outDir: 'dist-electron'
            }
          }
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload()
          },
          vite: {
            build: {
              outDir: 'dist-electron'
            }
          }
        }
      ]),
      renderer()
    ] : [])
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/proxy': {
        target: 'https://music-api.gdstudio.xyz/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy/, '/api.php'),
      },
    },
  },
})

