export const APP_NAME = 'SDU Meow'

export const DEFAULT_FRONTEND_BASE_URL =
  'https://meow.sduonline.cn'

export const DEFAULT_API_BASE_URL =
  `${DEFAULT_FRONTEND_BASE_URL}/api`

export const STORAGE_KEYS = {
  token: 'sdu_meow_token',
  refreshToken: 'sdu_meow_refresh_token',
  auth: 'sdu_meow_auth',
  authLoginMode: 'sdu_meow_auth_login_mode',
  authLoginNotice: 'sdu_meow_auth_login_notice',
  campus: 'sdu_meow_campus',
} as const
