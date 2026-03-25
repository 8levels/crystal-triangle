import type { Item, RankedResult, HistoryEntry, HistoryRankedResult } from '@/types'

const HISTORY_KEY = 'ct_history'
const HISTORY_LIMIT = 50

function toHistoryResults(results: RankedResult[]): HistoryRankedResult[] {
  return results.map((r) => ({
    rank: r.rank,
    letter: r.item.letter,
    label: r.item.label,
    votes: r.votes,
    isPriority: r.isPriority,
    isDeferred: r.isDeferred,
  }))
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveSession(items: Item[], results: RankedResult[]): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    items: items.map((item) => ({ ...item })),
    results: toHistoryResults(results),
  }

  const current = loadHistory()
  const next = [entry, ...current].slice(0, HISTORY_LIMIT)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return entry
}
