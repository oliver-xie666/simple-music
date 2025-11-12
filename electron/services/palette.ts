import axios from 'axios'

const MAX_DIMENSION = 96
const TARGET_SAMPLE_COUNT = 2400

interface DecodedImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

interface PaletteStop {
  gradient: string
  colors: string[]
}

interface ThemeTokens {
  primaryColor: string
  primaryColorDark: string
}

export interface PaletteResponse {
  source: string
  baseColor: string
  averageColor: string
  accentColor: string
  contrastColor: string
  gradients: Record<'light' | 'dark', PaletteStop>
  tokens: Record<'light' | 'dark', ThemeTokens>
}

interface HslColor {
  h: number
  s: number
  l: number
}

interface RgbColor {
  r: number
  g: number
  b: number
}

interface AnalyzedColors {
  average: HslColor
  accent: HslColor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function componentToHex(value: number): string {
  const clamped = clamp(Math.round(value), 0, 255)
  return clamped.toString(16).padStart(2, '0')
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rNorm = clamp(r / 255, 0, 1)
  const gNorm = clamp(g / 255, 0, 1)
  const bNorm = clamp(b / 255, 0, 1)

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2
    } else {
      h = (rNorm - gNorm) / delta + 4
    }
    h *= 60
    if (h < 0) {
      h += 360
    }
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h, s, l }
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function hslToRgb(h: number, s: number, l: number): RgbColor {
  const saturation = clamp(s, 0, 1)
  const lightness = clamp(l, 0, 1)

  const normalizedHue = ((h % 360) + 360) % 360 / 360

  if (saturation === 0) {
    const value = lightness * 255
    return { r: value, g: value, b: value }
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q

  const r = hueToRgb(p, q, normalizedHue + 1 / 3) * 255
  const g = hueToRgb(p, q, normalizedHue) * 255
  const b = hueToRgb(p, q, normalizedHue - 1 / 3) * 255

  return { r, g, b }
}

function hslToHex(color: HslColor): string {
  const rgb = hslToRgb(color.h, color.s, color.l)
  return rgbToHex(rgb)
}

function relativeLuminance(r: number, g: number, b: number): number {
  const normalize = (value: number) => {
    const channel = clamp(value / 255, 0, 1)
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  }

  const rLin = normalize(r)
  const gLin = normalize(g)
  const bLin = normalize(b)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

function pickContrastColor(color: RgbColor): string {
  const luminance = relativeLuminance(color.r, color.g, color.b)
  return luminance > 0.45 ? '#1f2937' : '#f8fafc'
}

function adjustSaturation(base: number, factor: number, offset = 0): number {
  return clamp(base * factor + offset, 0, 1)
}

function adjustLightness(base: number, offset: number, factor = 1): number {
  return clamp(base * factor + offset, 0, 1)
}

function analyzeImageColors(image: DecodedImage): AnalyzedColors {
  const { data } = image
  const totalPixels = data.length / 4
  const step = Math.max(1, Math.floor(totalPixels / TARGET_SAMPLE_COUNT))

  let totalR = 0
  let totalG = 0
  let totalB = 0
  let count = 0

  let accent: { color: HslColor; score: number } | null = null

  for (let index = 0; index < data.length; index += step * 4) {
    const alpha = data[index + 3]
    if (alpha < 48) {
      continue
    }

    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]

    totalR += r
    totalG += g
    totalB += b
    count++

    const hsl = rgbToHsl(r, g, b)
    const vibrance = hsl.s
    const balance = 1 - Math.abs(hsl.l - 0.5)
    const score = vibrance * 0.65 + balance * 0.35

    if (!accent || score > accent.score) {
      accent = { color: hsl, score }
    }
  }

  if (count === 0) {
    throw new Error('No opaque pixels available for analysis')
  }

  const averageR = totalR / count
  const averageG = totalG / count
  const averageB = totalB / count
  const average = rgbToHsl(averageR, averageG, averageB)

  const accentColor = accent ? accent.color : average

  return {
    average,
    accent: accentColor,
  }
}

function buildGradientStops(accent: HslColor): { light: PaletteStop; dark: PaletteStop } {
  const lightColors = [
    hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.4, 0.08), l: adjustLightness(accent.l, 0.42, 0.52) }),
    hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.52, 0.05), l: adjustLightness(accent.l, 0.26, 0.62) }),
    hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.65), l: adjustLightness(accent.l, 0.12, 0.72) }),
  ]

  const darkColors = [
    hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.55, 0.04), l: adjustLightness(accent.l, 0.14, 0.38) }),
    hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.62, 0.02), l: adjustLightness(accent.l, 0.04, 0.3) }),
    hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.72), l: adjustLightness(accent.l, -0.04, 0.22) }),
  ]

  return {
    light: {
      colors: lightColors,
      gradient: `linear-gradient(140deg, ${lightColors[0]} 0%, ${lightColors[1]} 45%, ${lightColors[2]} 100%)`,
    },
    dark: {
      colors: darkColors,
      gradient: `linear-gradient(135deg, ${darkColors[0]} 0%, ${darkColors[1]} 55%, ${darkColors[2]} 100%)`,
    },
  }
}

function buildThemeTokens(accent: HslColor): Record<'light' | 'dark', ThemeTokens> {
  return {
    light: {
      primaryColor: hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.6, 0.06), l: adjustLightness(accent.l, 0.22, 0.6) }),
      primaryColorDark: hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.72, 0.02), l: adjustLightness(accent.l, 0.06, 0.52) }),
    },
    dark: {
      primaryColor: hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.58, 0.04), l: adjustLightness(accent.l, 0.16, 0.42) }),
      primaryColorDark: hslToHex({ h: accent.h, s: adjustSaturation(accent.s, 0.68), l: adjustLightness(accent.l, 0.02, 0.32) }),
    },
  }
}

// 简化的图片解码 - 使用 Canvas API（在 Electron 中可用）
async function decodeImageFromBuffer(buffer: Buffer): Promise<DecodedImage> {
  // 在 Electron 主进程中，我们可以使用 sharp 库来处理图片
  // 这里先提供一个简化版本，返回基础的颜色分析
  // 实际使用时可以考虑集成 sharp 或其他图片处理库
  
  // 暂时返回一个默认的调色板，建议使用 canvas 或 sharp 库
  throw new Error('Image decoding needs sharp or canvas implementation')
}

async function buildPalette(imageBuffer: Buffer): Promise<PaletteResponse> {
  // TODO: 实现实际的图片解码
  // 建议：npm install sharp 然后使用 sharp 来解码和分析图片
  
  // 临时方案：返回一个默认的蓝色主题
  const defaultAccent: HslColor = { h: 210, s: 0.7, l: 0.5 }
  const gradientStops = buildGradientStops(defaultAccent)
  const tokens = buildThemeTokens(defaultAccent)
  const accentRgb = hslToRgb(defaultAccent.h, defaultAccent.s, defaultAccent.l)

  return {
    source: '',
    baseColor: hslToHex(defaultAccent),
    averageColor: hslToHex(defaultAccent),
    accentColor: hslToHex(defaultAccent),
    contrastColor: pickContrastColor(accentRgb),
    gradients: {
      light: gradientStops.light,
      dark: gradientStops.dark,
    },
    tokens,
  }
}

export async function extractPaletteFromImage(imageUrl: string): Promise<PaletteResponse> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    const buffer = Buffer.from(response.data)
    const palette = await buildPalette(buffer)
    palette.source = imageUrl

    return palette
  } catch (error: any) {
    console.error('提取调色板失败:', error.message)
    
    // 返回默认调色板
    const defaultAccent: HslColor = { h: 210, s: 0.7, l: 0.5 }
    const gradientStops = buildGradientStops(defaultAccent)
    const tokens = buildThemeTokens(defaultAccent)
    const accentRgb = hslToRgb(defaultAccent.h, defaultAccent.s, defaultAccent.l)

    return {
      source: imageUrl,
      baseColor: hslToHex(defaultAccent),
      averageColor: hslToHex(defaultAccent),
      accentColor: hslToHex(defaultAccent),
      contrastColor: pickContrastColor(accentRgb),
      gradients: {
        light: gradientStops.light,
        dark: gradientStops.dark,
      },
      tokens,
    }
  }
}

