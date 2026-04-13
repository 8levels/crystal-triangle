const USER_ID_KEY = 'ct_user_id'
const FALLBACK_USER_ID = '99f4554e-a6d4-4922-a79b-4345cfe08ecf'

export function getUserId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
      id = FALLBACK_USER_ID
      localStorage.setItem(USER_ID_KEY, id)
    }
    return id
  } catch {
    return FALLBACK_USER_ID
  }
}
