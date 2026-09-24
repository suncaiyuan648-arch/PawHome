/**
 * Read the platform/session actor envelope for account-only surfaces.
 *
 * The storage value is only an input to actorCapabilities.resolveTrustedActor;
 * this helper never turns the login flag, query, route, or display name into
 * an actor. Missing or malformed session data therefore remains fail-closed.
 */

export const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'

interface StorageReader {
  getStorageSync(key: string): unknown
}

function storageReader(): StorageReader | null {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
  return {
    getStorageSync: (key: string) => uni.getStorageSync<unknown>(key),
  }
}

export function readActorSession(): unknown | null {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
  const storage = storageReader()
  if (!storage) return null
  try {
    return storage.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function createActorProvider(): () => unknown | null {
  return () => readActorSession()
}
