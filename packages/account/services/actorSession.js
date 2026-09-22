/**
 * Read the platform/session actor envelope for account-only surfaces.
 *
 * The storage value is only an input to actorCapabilities.resolveTrustedActor;
 * this helper never turns the login flag, query, route, or display name into
 * an actor. Missing or malformed session data therefore remains fail-closed.
 */

export const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'

export function readActorSession() {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
  try {
    return uni.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null
  } catch (error) {
    return null
  }
}

export function createActorProvider() {
  return () => readActorSession()
}

