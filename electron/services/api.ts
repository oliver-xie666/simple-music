import axios from 'axios'

const API_BASE_URL = 'https://music-api.gdstudio.xyz/api.php'

function generateSignature() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 获取歌曲 URL
export async function getSongUrl(songId: string, source: string = 'netease', quality: string = '320') {
  const signature = generateSignature()
  const url = `${API_BASE_URL}?types=url\u0026id=${songId}\u0026source=${source}\u0026br=${quality}\u0026s=${signature}`
  
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
  const url = `${API_BASE_URL}?types=lyric\u0026id=${songId}\u0026source=${source}\u0026s=${signature}`
  
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
  return `${API_BASE_URL}?types=pic\u0026id=${picId}\u0026source=${source}\u0026size=300\u0026s=${signature}`
}

// 探索雷达 - 随机获取歌单
export async function getRadarPlaylist() {
  const signature = generateSignature()
  const playlistId = '3778678' // 默认歌单ID
  const url = `${API_BASE_URL}?types=playlist\u0026id=${playlistId}\u0026limit=50\u0026offset=0\u0026s=${signature}`
  
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
