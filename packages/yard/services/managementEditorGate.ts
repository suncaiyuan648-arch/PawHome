/** Package-local fail-closed seam until the yard reader/writer is approved. */

interface EditorGateFailure {
  readonly success: false
  readonly error: { readonly code: 'INVALID_ID' | 'READER_MISSING' }
  readonly readOnly: true
  readonly canWrite: false
}

export interface YardEditorGateOptions {
  actorProvider?: () => unknown
}

function failure(code: EditorGateFailure['error']['code']): EditorGateFailure {
  return { success: false, error: { code }, readOnly: true, canWrite: false }
}

export function readEditorResource(
  resourceType: 'yard',
  id: string,
  options: YardEditorGateOptions = {},
): EditorGateFailure {
  void options
  if (resourceType !== 'yard' || typeof id !== 'string' || !id.trim()) return failure('INVALID_ID')
  return failure('READER_MISSING')
}
