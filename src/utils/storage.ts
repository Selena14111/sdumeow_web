import { STORAGE_KEYS } from './constants'

export const storage = {
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.token)
  },
  setToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.token, token)
  },
  clearToken() {
    localStorage.removeItem(STORAGE_KEYS.token)
  },
}
