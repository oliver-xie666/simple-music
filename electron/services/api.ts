import axios from 'axios'

// 完全按照 Solara 的 API 格式
const API_BASE_URL = 'https://music-api.gdstudio.xyz/api.php'

function generateSignature() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 搜索音乐
export async function searchMusic(keyword: string, source: string = 'netease', page: number = 1) {
  const signature = generateSignature()
  const url = `${API_BASE_URL}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=20&pages=${page}&s=${signature}`
  
  try {
    console.log('搜索请求:', url)
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    console.log('搜索响应:', response.data)
    return response.data
  } catch (error: any) {
    console.error('搜索失败:', error.message)
    throw error
  }
}

// 获取歌曲 URL
export async function getSongUrl(songId: string, source: string = 'netease', quality: string = '320') {
  const signature = generateSignature()
  const url = `${API_BASE_URL}?types=url&id=${songId}&source=${source}&br=${quality}&s=${signature}`
  
  try {
    console.log('获取URL请求:', url)
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    console.log('URL响应:', response.data)
    return response.data
  } catch (error: any) {
    console.error('获取URL失败:', error.message)
    throw error
  }
}

// 获取歌词
export async function getLyric(songId: string, source: string = 'netease') {
  const signature = generateSignature()
  const url = `${API_BASE_URL}?types=lyric&id=${songId}&source=${source}&s=${signature}`
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('获取歌词失败:', error.message)
    throw error
  }
}

// 获取封面 URL
export function getPicUrl(picId: string, source: string = 'netease') {
  const signature = generateSignature()
  return `${API_BASE_URL}?types=pic&id=${picId}&source=${source}&size=300&s=${signature}`
}

// 探索雷达 - 随机获取歌单
export async function getRadarPlaylist() {
  const signature = generateSignature()
  const playlistId = '3778678' // 默认歌单ID
  const url = `${API_BASE_URL}?types=playlist&id=${playlistId}&limit=50&offset=0&s=${signature}`
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('获取歌单失败:', error.message)
    throw error
  }
}
