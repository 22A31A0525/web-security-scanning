const TOKEN_STORAGE_KEY = 'bearer_token'

/**
 * API Layer - Token Management & Headers
 */

// Load bearer token from localStorage
export function loadBearerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

// Write bearer token to localStorage
export function writeBearerToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch (err) {
    console.error('Failed to save bearer token', err)
  }
}

// Remove bearer token from localStorage
export function clearBearerToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to remove bearer token', err)
  }
}

// Generate Authorization header with bearer token
export function getAuthHeaders(): Record<string, string> {
  const token = loadBearerToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Generate temporary bearer token on successful credentials
export function generateTemporaryBearerToken(email: string): string {
  const payload = btoa(
    JSON.stringify({
      sub: email,
      role: 'security_analyst',
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
    })
  )
  return `ey.${payload}.sec_sig_${Math.random().toString(36).substring(2, 10)}`
}
