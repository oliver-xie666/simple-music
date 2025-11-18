/**
 * URL 处理工具函数
 * 参考 Solara 项目实现
 */

/**
 * 将 HTTP URL 升级为 HTTPS（如果当前页面是 HTTPS）
 */
export function preferHttpsUrl(url: string): string {
  if (!url || typeof url !== 'string') return url

  try {
    const parsedUrl = new URL(url, window.location.href)
    if (parsedUrl.protocol === 'http:' && window.location.protocol === 'https:') {
      parsedUrl.protocol = 'https:'
      return parsedUrl.toString()
    }
    return parsedUrl.toString()
  } catch (error) {
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
      return 'https://' + url.substring('http://'.length)
    }
    return url
  }
}

/**
 * 构建音频代理 URL
 * 对于 kuwo.cn 的 HTTP 链接，通过 /proxy?target=... 代理
 */
export function buildAudioProxyUrl(url: string): string {
  if (!url || typeof url !== 'string') return url

  try {
    const parsedUrl = new URL(url, window.location.href)
    if (parsedUrl.protocol === 'https:') {
      return parsedUrl.toString()
    }

    // 对于 kuwo.cn 的 HTTP 链接，使用代理
    if (parsedUrl.protocol === 'http:' && /(^|\.)kuwo\.cn$/i.test(parsedUrl.hostname)) {
      const API_BASE_URL = import.meta.env.DEV 
        ? '/proxy' 
        : 'https://music-api.gdstudio.xyz/api.php'
      return `${API_BASE_URL}?target=${encodeURIComponent(parsedUrl.toString())}`
    }

    return parsedUrl.toString()
  } catch (error) {
    console.warn('无法解析音频地址，跳过代理', error)
    return url
  }
}

