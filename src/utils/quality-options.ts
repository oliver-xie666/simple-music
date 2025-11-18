import type { QualityType } from '../types'

export interface QualityOption {
  value: QualityType
  label: string
  description: string
}

export const QUALITY_OPTIONS: QualityOption[] = [
  { value: '128', label: '标准音质', description: '128k' },
  { value: '192', label: '较高音质', description: '192k' },
  { value: '320', label: '超高音质', description: '320k' },
  { value: 'flac', label: '无损音质', description: 'FLAC' }
]

