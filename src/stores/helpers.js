/**
 * Wraps a store request: toggles `isLoading`, resets/sets `error`, and rethrows
 * on failure. The store passed as `store` must expose `isLoading` and `error`.
 */
export async function runRequest(store, request, fallbackMessage = 'Request failed') {
  try {
    store.isLoading = true
    store.error = null
    return await request()
  } catch (error) {
    store.error = error?.message || fallbackMessage
    throw error
  } finally {
    store.isLoading = false
  }
}
