/**
 * API 限流器
 * 限制接口调用频率：5分钟60次
 */

interface RateLimitRecord {
  timestamp: number
  count: number
}

class RateLimiter {
  private windowMs: number = 5 * 60 * 1000 // 5分钟
  private maxRequests: number = 60 // 最大60次
  private records: RateLimitRecord[] = []

  /**
   * 检查是否可以发起请求
   * @returns true 如果可以，false 如果超过限制
   */
  canRequest(): boolean {
    const now = Date.now()
    
    // 清理过期的记录
    this.records = this.records.filter(
      record => now - record.timestamp < this.windowMs
    )

    // 计算当前窗口内的总请求数
    const totalCount = this.records.reduce((sum, record) => sum + record.count, 0)

    return totalCount < this.maxRequests
  }

  /**
   * 记录一次请求
   */
  recordRequest(): void {
    const now = Date.now()
    
    // 清理过期的记录
    this.records = this.records.filter(
      record => now - record.timestamp < this.windowMs
    )

    // 添加新记录
    this.records.push({
      timestamp: now,
      count: 1
    })
  }

  /**
   * 获取当前窗口内的请求数
   */
  getCurrentCount(): number {
    const now = Date.now()
    this.records = this.records.filter(
      record => now - record.timestamp < this.windowMs
    )
    return this.records.reduce((sum, record) => sum + record.count, 0)
  }

  /**
   * 获取下次可请求的时间（毫秒）
   */
  getNextAvailableTime(): number {
    if (this.canRequest()) {
      return 0
    }

    const now = Date.now()
    // 找到最早的记录
    const oldestRecord = this.records[0]
    if (!oldestRecord) {
      return 0
    }

    // 计算最早记录过期的时间
    return oldestRecord.timestamp + this.windowMs - now
  }
}

// 单例模式
export const rateLimiter = new RateLimiter()

