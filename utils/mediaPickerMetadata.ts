/** Minimal media-picker callback metadata consumed by application pages. */
export interface ChooseMediaSuccessMetadata {
  tempFiles: Array<{
    tempFilePath: string
  }>
}

/** The non-WeChat chooseImage API may expose one path or a list of paths. */
export interface ChooseImageSuccessMetadata {
  tempFilePaths: string | string[]
}
