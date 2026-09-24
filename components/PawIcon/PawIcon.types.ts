// The runtime registry and generated name list remain the source of truth for
// the icon implementation while the application migrates to TypeScript.
export type PawIconName = string

export type PawIconSize = 'xs' | 'sm' | 'md' | 'base' | 'lg' | number | `${number}`
export type PawIconFlip = 'none' | 'horizontal' | 'vertical' | 'both'

export interface PawIconProps {
  name: PawIconName
  size?: PawIconSize
  color?: string
  label?: string
  rotate?: number
  flip?: PawIconFlip
}
