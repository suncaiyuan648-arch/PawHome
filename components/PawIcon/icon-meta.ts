/**
 * Build-time metadata contract for PawIcon V3.
 *
 * Values are authored in config/paw-icons.cjs and emitted into the generated
 * registry for the Lab. They are intentionally not used to calculate a
 * runtime glyph size.
 */
// 12/16/20/24/28 are the standard optical slots. A numeric source-frame
// slot is also allowed for the intentionally large Figma display assets
// (for example the 43px feeding bag and 60px jury result artwork).
export type PawIconSlot = number

export interface PawIconFrame {
  width: number
  height: number
}

export interface PawIconMeta {
  sourceFrame: PawIconFrame
  sourceBounds?: PawIconFrame | null
  recommendedSlot: PawIconSlot | null
  slot: PawIconSlot
  family?: string | null
  figmaNodeId?: string | null
  sourceLabel?: string | null
}
