import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { rateLimiter } from '../utils/rate-limiter'

// API 配置
const API_BASE_URL = 'https://music-api.gdstudio.xyz/api.php'
const isDev = import.meta.env.DEV

// 生成签名
export function generateSignature(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
    // 注意：在 Web 环境中，浏览器不允许设置 User-Agent 头
    // 如果需要，可以在请求拦截器中条件设置（仅 Electron 环境）
  }
})

// 请求拦截器 - 统一处理请求
apiClient.interceptors.request.use(
  (config) => {
    // 开发环境使用代理，生产环境使用完整 URL
    // 这里不需要修改 config，因为 apiRequest 已经处理了 URL
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
    // 统一处理响应数据
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
 * @param skipRateLimit 是否跳过限流检查（默认false）
 * @returns Promise<AxiosResponse>
 */
export async function apiRequest(
  params: ApiRequestParams,
  config?: AxiosRequestConfig,
  skipRateLimit: boolean = false
): Promise<AxiosResponse> {
  // 检查限流（除非明确跳过）
  if (!skipRateLimit) {
    if (!rateLimiter.canRequest()) {
      const nextTime = rateLimiter.getNextAvailableTime()
      const minutes = Math.ceil(nextTime / 60000)
      throw new Error(`接口调用过于频繁，请等待 ${minutes} 分钟后再试`)
    }
    
    // 记录请求
    rateLimiter.recordRequest()
  }

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

  // 开发环境使用代理，生产环境使用完整 URL
  if (isDev) {
    const url = `/proxy?${queryString}`
    return apiClient.get(url, { ...config, baseURL: '/' })
  } else {
    const url = `${API_BASE_URL}?${queryString}`
    return apiClient.get(url, { ...config, baseURL: undefined })
  }
}

export default apiClient

