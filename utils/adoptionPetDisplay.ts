/** 领养记录里单只猫展示：头像兜底（接口/本地缺省时） */
export const ADOPTION_PET_PLACEHOLDER_IMG = '/static/home-feed-1.png'

export interface AdoptionPetDisplayRecord {
  avatar?: unknown
}

export function adoptionPetAvatarSrc(p?: AdoptionPetDisplayRecord | null): string {
  const a = p && p.avatar
  return typeof a === 'string' && a.trim() ? a.trim() : ADOPTION_PET_PLACEHOLDER_IMG
}
