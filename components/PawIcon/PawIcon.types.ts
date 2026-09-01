// The application is JavaScript-based; the runtime registry and generated name
// list remain the source of truth for the JavaScript implementation.
export type PawIconName = string

export type PawIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | `${number}`
export type PawIconFlip = 'none' | 'horizontal' | 'vertical' | 'both'

export interface PawIconProps {
  name: PawIconName
  size?: PawIconSize
  color?: string
  label?: string
  rotate?: number
  flip?: PawIconFlip
}
