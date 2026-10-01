import { STORAGE_KEYS } from './constants'

export const storage = {
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.token)
  },
  setToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.token, token)
  },
  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.refreshToken)
  },
  setRefreshToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, token)
  },
  setTokens(tokens: { token?: string | null; refreshToken?: string | null }) {
    if (tokens.token) {
      localStorage.setItem(STORAGE_KEYS.token, tokens.token)
    }
    if (tokens.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken)
    }
  },
  clearToken() {
    localStorage.removeItem(STORAGE_KEYS.token)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
  },
}
