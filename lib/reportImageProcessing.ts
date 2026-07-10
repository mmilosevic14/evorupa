export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 800
export const WEBP_QUALITY = 0.72

export function getScaledImageDimensions(width: number, height: number) {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const dominantDimension = Math.max(safeWidth, safeHeight)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / dominantDimension)

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  }
}