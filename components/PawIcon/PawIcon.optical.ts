/**
 * Build-time optical metadata only.
 *
 * This file documents the private shape consumed by scripts/build-paw-icons.cjs.
 * It is deliberately not part of PawIcon's runtime/public prop API.
 */
export interface PawIconOpticalViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PawIconOpticalMetadata {
  viewBox?: PawIconOpticalViewBox
  scale?: number
  offsetX?: number
  offsetY?: number
}
