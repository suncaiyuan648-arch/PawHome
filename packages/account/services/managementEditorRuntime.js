/**
 * Small page binding for management editors.
 *
 * A page may provide a domain reader/writer when the production transport is
 * approved.  Until then both reads and writes fail closed through the
 * canonical management adapters; a form cannot claim success from local
 * component state alone.
 */

import { readManagementResourceWithReader } from './managementAdapter.js'
import { updateManagementResource } from './managementMutationAdapter.js'

const RESOURCE_TYPES = Object.freeze(['profile', 'yard', 'animal'])

export function readEditorResource(resourceType, id, options = {}) {
  if (!RESOURCE_TYPES.includes(resourceType)) return { success: false, error: { code: 'INVALID_RESOURCE_TYPE' }, readOnly: true, canWrite: false }
  if (typeof options.reader === 'function') {
    return readManagementResourceWithReader(resourceType, id, {
      actorProvider: options.actorProvider,
      reader: options.reader,
      readers: options.readers,
      policy: options.policy,
      access: 'management',
    })
  }
  return { success: false, error: { code: 'READER_MISSING' }, readOnly: true, canWrite: false }
}

export function saveEditorResource(resourceType, id, patch, options = {}) {
  if (!RESOURCE_TYPES.includes(resourceType)) return { success: false, error: { code: 'INVALID_RESOURCE_TYPE' }, readOnly: true, canWrite: false }
  return updateManagementResource(resourceType, id, patch, {
    actorProvider: options.actorProvider,
    reader: options.reader,
    readers: options.readers,
    policy: options.policy,
    writer: options.writer,
    intent: options.intent || 'edit',
    cancelled: options.cancelled,
  })
}

