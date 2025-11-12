import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

const STORAGE_PATH = join(app.getPath('userData'), 'storage.json')

let storageCache: Record<string, any> = {}

// 初始化存储
async function initStorage() {
  try {
    const data = await fs.readFile(STORAGE_PATH, 'utf-8')
    storageCache = JSON.parse(data)
  } catch (error) {
    // 文件不存在或解析失败，使用空对象
    storageCache = {}
  }
}

// 保存到磁盘
async function saveToFile() {
  try {
    await fs.writeFile(STORAGE_PATH, JSON.stringify(storageCache, null, 2), 'utf-8')
  } catch (error) {
    console.error('保存存储失败:', error)
  }
}

// 保存数据
export async function saveToStore(key: string, data: any) {
  if (!Object.keys(storageCache).length) {
    await initStorage()
  }
  
  storageCache[key] = data
  await saveToFile()
}

// 加载数据
export async function loadFromStore(key: string) {
  if (!Object.keys(storageCache).length) {
    await initStorage()
  }
  
  return storageCache[key] || null
}

// 删除数据
export async function removeFromStore(key: string) {
  if (!Object.keys(storageCache).length) {
    await initStorage()
  }
  
  delete storageCache[key]
  await saveToFile()
}

// 应用启动时初始化
initStorage()

