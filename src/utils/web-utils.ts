/**
 * Web 环境工具函数
 * 实现 Web 版本的功能（下载、颜色提取、文件对话框、导入导出等）
 */

/**
 * Web 版本：下载文件
 * 使用 <a> 标签触发下载
 */
export async function downloadFile(
  url: string,
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 先获取文件内容（处理跨域问题）
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    // 创建 <a> 标签触发下载
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放 blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)

    return { success: true }
  } catch (error: any) {
    console.error('[Web Utils] 下载失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Web 版本：提取封面颜色
 * 使用 Canvas API 分析图片颜色
 */
export async function extractPaletteFromImage(imageUrl: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        // 创建 Canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('无法创建 Canvas 上下文')
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // 分析颜色
        const colors = analyzeImageColors(data, canvas.width * canvas.height)
        const palette = buildPalette(colors)

        resolve(palette)
      } catch (error: any) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = imageUrl
  })
}

/**
 * 分析图片颜色
 */
function analyzeImageColors(data: Uint8ClampedArray, totalPixels: number): {
  average: { r: number; g: number; b: number }
  accent: { r: number; g: number; b: number; score: number }
} {
  const TARGET_SAMPLE_COUNT = 10000
  const step = Math.max(1, Math.floor(totalPixels / TARGET_SAMPLE_COUNT))

  let totalR = 0
  let totalG = 0
  let totalB = 0
  let count = 0

  let accent: { r: number; g: number; b: number; score: number } | null = null

  for (let i = 0; i < data.length; i += step * 4) {
    const alpha = data[i + 3]
    if (alpha < 48) {
      continue // 跳过透明像素
    }

    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    totalR += r
    totalG += g
    totalB += b
    count++

    // 计算颜色的鲜艳度和平衡度
    const hsl = rgbToHsl(r, g, b)
    const vibrance = hsl.s // 饱和度
    const balance = 1 - Math.abs(hsl.l - 0.5) // 亮度平衡
    const score = vibrance * 0.65 + balance * 0.35

    if (!accent || score > accent.score) {
      accent = { r, g, b, score }
    }
  }

  if (count === 0) {
    // 如果没有有效像素，返回默认颜色
    return {
      average: { r: 128, g: 128, b: 128 },
      accent: { r: 128, g: 128, b: 128, score: 0 }
    }
  }

  const averageR = totalR / count
  const averageG = totalG / count
  const averageB = totalB / count

  return {
    average: { r: averageR, g: averageG, b: averageB },
    accent: accent || { r: averageR, g: averageG, b: averageB, score: 0 }
  }
}

/**
 * RGB 转 HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h, s, l }
}

/**
 * HSL 转 RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * HSL 转十六进制
 */
function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
}

/**
 * 选择对比色（黑色或白色）
 */
function pickContrastColor(rgb: { r: number; g: number; b: number }): string {
  // 计算亮度
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * 构建调色板
 */
function buildPalette(colors: {
  average: { r: number; g: number; b: number }
  accent: { r: number; g: number; b: number; score: number }
}): any {
  const accentHsl = rgbToHsl(colors.accent.r, colors.accent.g, colors.accent.b)
  const averageHsl = rgbToHsl(colors.average.r, colors.average.g, colors.average.b)

  // 构建渐变
  const gradientStops = buildGradientStops(accentHsl)
  const tokens = buildThemeTokens(accentHsl)
  const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l)

  return {
    source: '',
    baseColor: hslToHex(averageHsl.h, averageHsl.s, averageHsl.l),
    averageColor: hslToHex(averageHsl.h, averageHsl.s, averageHsl.l),
    accentColor: hslToHex(accentHsl.h, accentHsl.s, accentHsl.l),
    contrastColor: pickContrastColor(accentRgb),
    gradients: {
      light: gradientStops.light,
      dark: gradientStops.dark
    },
    tokens
  }
}

/**
 * 构建渐变停止点
 */
function buildGradientStops(accent: { h: number; s: number; l: number }): {
  light: Array<{ color: string; position: number }>
  dark: Array<{ color: string; position: number }>
} {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const adjustLightness = (base: number, offset: number, factor = 1) =>
    clamp(base * factor + offset, 0, 1)

  const lightStops = [
    { color: hslToHex(accent.h, accent.s, adjustLightness(accent.l, 0.4, 0.8)), position: 0 },
    { color: hslToHex(accent.h, accent.s, adjustLightness(accent.l, 0.2, 0.9)), position: 0.5 },
    { color: hslToHex(accent.h, accent.s, adjustLightness(accent.l, 0, 1)), position: 1 }
  ]

  const darkStops = [
    { color: hslToHex(accent.h, accent.s, adjustLightness(accent.l, -0.2, 1.2)), position: 0 },
    { color: hslToHex(accent.h, accent.s, adjustLightness(accent.l, -0.1, 1.1)), position: 0.5 },
    { color: hslToHex(accent.h, accent.s, adjustLightness(accent.l, 0, 1)), position: 1 }
  ]

  return { light: lightStops, dark: darkStops }
}

/**
 * 构建主题令牌
 */
function buildThemeTokens(accent: { h: number; s: number; l: number }): any {
  const accentRgb = hslToRgb(accent.h, accent.s, accent.l)
  return {
    primary: hslToHex(accent.h, accent.s, accent.l),
    secondary: hslToHex(accent.h, accent.s * 0.7, accent.l * 0.8),
    accent: hslToHex(accent.h, accent.s, accent.l),
    background: hslToHex(accent.h, accent.s * 0.3, 0.95),
    surface: hslToHex(accent.h, accent.s * 0.2, 0.98),
    text: pickContrastColor(accentRgb)
  }
}

/**
 * Web 版本：显示文件选择对话框
 * 使用 <input type="file"> 实现
 */
export function showFileInputDialog(
  options: {
    accept?: string
    multiple?: boolean
  } = {}
): Promise<{ success: boolean; files?: FileList; canceled?: boolean }> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = options.accept || '*/*'
    input.multiple = options.multiple || false
    input.style.display = 'none'

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        resolve({ success: true, files: target.files })
      } else {
        resolve({ success: false, canceled: true })
      }
      document.body.removeChild(input)
    }

    input.oncancel = () => {
      resolve({ success: false, canceled: true })
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  })
}

/**
 * Web 版本：导入 JSON
 * 使用文件输入对话框
 */
export async function importJson(): Promise<{ success: boolean; data?: any; canceled?: boolean; error?: string }> {
  try {
    const result = await showFileInputDialog({
      accept: '.json,application/json',
      multiple: false
    })

    if (result.canceled || !result.files) {
      return { success: false, canceled: true }
    }

    const file = result.files[0]
    const text = await file.text()
    const data = JSON.parse(text)

    return { success: true, data }
  } catch (error: any) {
    console.error('[Web Utils] 导入 JSON 失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Web 版本：导出 JSON
 * 使用文件下载
 */
export async function exportJson(params: {
  data: any
  defaultName?: string
}): Promise<{ success: boolean; canceled?: boolean; error?: string }> {
  try {
    const { data, defaultName = 'playlist.json' } = params
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = defaultName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)

    return { success: true }
  } catch (error: any) {
    console.error('[Web Utils] 导出 JSON 失败:', error)
    return { success: false, error: error.message }
  }
}

