import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// API 配置
const API_BASE_URL = 'https://music-api.gdstudio.xyz/api.php'

// 生成签名
export function generateSignature(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL.replace('/api.php', ''),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})

// 请求拦截器 - 统一处理请求
apiClient.interceptors.request.use(
  (config) => {
    // Electron 主进程直接使用完整 API URL
    if (config.url && !config.url.includes('api.php')) {
      config.url = `/api.php${config.url.startsWith('/') ? '' : '/'}${config.url}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('[API] 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理响应
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // 统一错误处理
    const errorMessage = error.response?.data 
      ? (error.response.data as any)?.message || error.message
      : error.message || '请求失败'
    
    console.error('[API] 请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: errorMessage
    })
    
    return Promise.reject(error)
  }
)

// 统一的请求方法
export interface ApiRequestParams {
  types: string
  [key: string]: string | number | undefined
}

/**
 * 统一的 API 请求方法
 * @param params API 参数对象
 * @param config 额外的 axios 配置
 * @returns Promise<AxiosResponse>
 */
export function apiRequest(
  params: ApiRequestParams,
  config?: AxiosRequestConfig
): Promise<AxiosResponse> {
  // 自动添加签名
  const finalParams = {
    ...params,
    s: generateSignature()
  }

  // 构建查询字符串
  const queryString = new URLSearchParams(
    Object.entries(finalParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value)
        return acc
      }, {} as Record<string, string>)
  ).toString()

  const url = `${API_BASE_URL}?${queryString}`
  return apiClient.get(url, config)
}

export default apiClient

