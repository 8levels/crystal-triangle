const STREAK_KEY = 'ct_streak'

type StreakState = {
  lastDate: string
  currentStreak: number
}

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function dayDiff(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const aMidnight = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const bMidnight = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((aMidnight - bMidnight) / msPerDay)
}

function readStreak(): StreakState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StreakState
    if (
      !parsed ||
      typeof parsed.lastDate !== 'string' ||
      typeof parsed.currentStreak !== 'number'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function recordToday(): void {
  if (typeof window === 'undefined') return

  const today = new Date()
  const todayYmd = toYmd(today)
  const current = readStreak()

  if (!current) {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify({ lastDate: todayYmd, currentStreak: 1 })
    )
    return
  }

  const last = parseYmd(current.lastDate)
  if (!last) {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify({ lastDate: todayYmd, currentStreak: 1 })
    )
    return
  }

  const diff = dayDiff(today, last)
  if (diff <= 0) {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify({ lastDate: todayYmd, currentStreak: current.currentStreak })
    )
    return
  }

  const nextStreak = diff === 1 ? current.currentStreak + 1 : 1
  localStorage.setItem(
    STREAK_KEY,
    JSON.stringify({ lastDate: todayYmd, currentStreak: nextStreak })
  )
}

export function getStreak(): number {
  if (typeof window === 'undefined') return 0

  const today = new Date()
  const todayYmd = toYmd(today)
  const current = readStreak()
  if (!current) return 0

  const last = parseYmd(current.lastDate)
  if (!last) {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify({ lastDate: todayYmd, currentStreak: 1 })
    )
    return 1
  }

  const diff = dayDiff(today, last)
  if (diff <= 1) return current.currentStreak

  localStorage.setItem(
    STREAK_KEY,
    JSON.stringify({ lastDate: todayYmd, currentStreak: 1 })
  )
  return 1
}
