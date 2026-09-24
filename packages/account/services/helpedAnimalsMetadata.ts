export interface HelpedAnimalsPageState {
  photoList: string[]
}

export interface HelpedAnimalPreviewOptions {
  urls: string[]
  current: string
}

const HELPED_ANIMAL_PHOTO_MOCKS: readonly string[] = [
  '/static/figma/helped/animal-01.jpg',
  '/static/figma/helped/animal-02.jpg',
  '/static/figma/helped/animal-03.jpg',
  '/static/figma/helped/animal-04.jpg',
  '/static/figma/helped/animal-05.jpg',
  '/static/figma/helped/animal-06.jpg',
  '/static/figma/helped/animal-07.png',
  '/static/figma/helped/animal-08.jpg',
  '/static/figma/helped/animal-09.jpg',
  '/static/figma/helped/animal-10.jpg',
  '/static/figma/helped/animal-11.jpg',
]

export function createHelpedAnimalsPageMetadata(): HelpedAnimalsPageState {
  return { photoList: [...HELPED_ANIMAL_PHOTO_MOCKS] }
}

export function createHelpedAnimalPreviewOptions(
  photoList: readonly string[],
  index: number,
): HelpedAnimalPreviewOptions | null {
  if (!Number.isInteger(index) || index < 0 || index >= photoList.length) return null
  const current = photoList[index]
  if (!current) return null
  return { urls: [...photoList], current }
}
