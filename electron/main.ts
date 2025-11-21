import { app, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { setupIpcHandlers, cancelAllActiveDownloads } from './services/ipc'

process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : join(process.env.DIST, '../public')

let win: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    maxWidth: 1600,
    maxHeight: 1000,
    title: 'Simple Music',
    frame: true,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  // 测试主动发送消息到渲染进程
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(process.env.DIST!, 'index.html'))
  }

  // 注册 F12 快捷键打开/关闭开发者工具（生产环境也支持）
  globalShortcut.register('F12', () => {
    if (win) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
    }
  })

  // 注册 Ctrl+Shift+I 快捷键（Windows/Linux）或 Cmd+Option+I（Mac）
  const devToolsShortcut = process.platform === 'darwin' ? 'Command+Option+I' : 'Control+Shift+I'
  globalShortcut.register(devToolsShortcut, () => {
    if (win) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
    }
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  // 设置 IPC 通信处理器
  setupIpcHandlers()
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭
app.on('window-all-closed', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
  
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

// 应用退出前注销所有快捷键并取消所有下载
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  // 取消所有正在进行的下载并删除未完成的文件
  cancelAllActiveDownloads()
})

