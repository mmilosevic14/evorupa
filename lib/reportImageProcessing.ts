export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 800
export const WEBP_QUALITY = 0.72

export function getCenteredSquareCrop(width: number, height: number) {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const size = Math.max(1, Math.min(safeWidth, safeHeight))

  return {
    sourceX: Math.max(0, Math.floor((safeWidth - size) / 2)),
    sourceY: Math.max(0, Math.floor((safeHeight - size) / 2)),
    sourceSize: size,
  }
}

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