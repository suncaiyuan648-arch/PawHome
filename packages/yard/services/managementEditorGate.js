/** Package-local fail-closed seam until the yard reader/writer is approved. */
export function readEditorResource(resourceType, id, options = {}) {
  void options
  if (!['yard'].includes(resourceType) || typeof id !== 'string' || !id.trim()) {
    return { success: false, error: { code: 'INVALID_ID' }, readOnly: true, canWrite: false }
  }
  return { success: false, error: { code: 'READER_MISSING' }, readOnly: true, canWrite: false }
}

