/**
 * Small page binding for management editors.
 *
 * A page may provide a domain reader/writer when the production transport is
 * approved. Until then both reads and writes fail closed through the
 * canonical management adapters; a form cannot claim success from local
 * component state alone.
 */

import {
	readManagementResourceWithReader,
	type ManagementActorProvider,
	type ManagementPolicyInput,
	type ManagementReaderFor,
	type ManagementReaderMap,
	type ManagementResourceType,
} from './managementAdapter.ts'
import {
	updateManagementResource,
	type ManagementMutationWriter,
	type ManagementPatchByResource,
} from './managementMutationAdapter.ts'

type JsonRecord = Record<string, unknown>

export type ManagementEditorOptions<R extends ManagementResourceType = ManagementResourceType> = {
	actorProvider?: ManagementActorProvider
	reader?: ManagementReaderFor<R>
	readers?: ManagementReaderMap
	policy?: ManagementPolicyInput
	writer?: ManagementMutationWriter<R>
	intent?: 'edit' | 'cancel'
	cancelled?: boolean
}

export interface EditorFailure {
  success: false
  error: {
    code: string
  }
  readOnly: true
  canWrite: false
}

export type EditorReadResult = EditorFailure | ReturnType<typeof readManagementResourceWithReader>
export type EditorSaveResult = EditorFailure | ReturnType<typeof updateManagementResource>

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isResourceType(value: unknown): value is ManagementResourceType {
  return value === 'profile' || value === 'yard' || value === 'animal'
}

function failure(code: string): EditorFailure {
  return {
    success: false,
    error: { code },
    readOnly: true,
    canWrite: false,
  }
}

export function readEditorResource<R extends ManagementResourceType>(
	resourceType: R,
	id: string,
	options: ManagementEditorOptions<NoInfer<R>> = {},
): EditorReadResult {
	if (!isResourceType(resourceType)) return failure('INVALID_RESOURCE_TYPE')
	const source = isRecord(options) ? options as unknown as ManagementEditorOptions<NoInfer<R>> : {}
  if (typeof source.reader === 'function') {
    return readManagementResourceWithReader(resourceType, id, {
      actorProvider: source.actorProvider,
      reader: source.reader,
      readers: source.readers,
      policy: source.policy,
      access: 'management',
    })
  }
  return failure('READER_MISSING')
}

export function saveEditorResource<R extends ManagementResourceType>(
	resourceType: R,
	id: string,
	patch: ManagementPatchByResource[NoInfer<R>],
	options: ManagementEditorOptions<NoInfer<R>> = {},
): EditorSaveResult {
	if (!isResourceType(resourceType)) return failure('INVALID_RESOURCE_TYPE')
	const source = isRecord(options) ? options as unknown as ManagementEditorOptions<NoInfer<R>> : {}
	return updateManagementResource(resourceType, id, patch, {
    actorProvider: source.actorProvider,
    reader: source.reader,
    readers: source.readers,
    policy: source.policy,
    writer: source.writer,
    intent: source.intent || 'edit',
    cancelled: source.cancelled,
  })
}
