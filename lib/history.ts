import type { Item, RankedResult, HistoryEntry, HistoryRankedResult } from '@/types'
import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/userId'

const HISTORY_KEY = 'ct_history'
const HISTORY_LIMIT = 50

type HistoryListener = () => void
const listeners = new Set<HistoryListener>()

export function subscribeHistory(listener: HistoryListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitHistory(): void {
  listeners.forEach((cb) => {
    try {
      cb()
    } catch {
      /* ignore subscriber errors */
    }
  })
}

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

function normalizeHistoryEntry(entry: unknown): HistoryEntry | null {
  if (!entry || typeof entry !== 'object') return null
  const raw = entry as Partial<HistoryEntry>
  if (typeof raw.id !== 'string' || typeof raw.timestamp !== 'string') return null

  const items: Item[] = Array.isArray(raw.items)
    ? raw.items
        .map((item, index) => {
          if (!item || typeof item !== 'object') return null
          const candidate = item as Partial<Item>
          if (typeof candidate.label !== 'string') return null
          return {
            id:
              typeof candidate.id === 'string' && candidate.id.length > 0
                ? candidate.id
                : `${raw.id}-item-${index}`,
            label: candidate.label,
            letter:
              typeof candidate.letter === 'string' && candidate.letter.length > 0
                ? candidate.letter
                : String.fromCharCode(65 + index),
          }
        })
        .filter((v): v is Item => Boolean(v))
    : []

  const results: HistoryRankedResult[] = Array.isArray(raw.results)
    ? raw.results
        .map((result, index) => {
          if (!result || typeof result !== 'object') return null
          const candidate = result as Partial<HistoryRankedResult>
          if (typeof candidate.label !== 'string') return null
          const rank = typeof candidate.rank === 'number' ? candidate.rank : index + 1
          return {
            rank,
            letter:
              typeof candidate.letter === 'string' && candidate.letter.length > 0
                ? candidate.letter
                : String.fromCharCode(65 + index),
            label: candidate.label,
            votes: typeof candidate.votes === 'number' ? candidate.votes : 0,
            isPriority:
              typeof candidate.isPriority === 'boolean' ? candidate.isPriority : rank <= 3,
            isDeferred:
              typeof candidate.isDeferred === 'boolean' ? candidate.isDeferred : rank >= 4,
          }
        })
        .filter((v): v is HistoryRankedResult => Boolean(v))
    : []

  return {
    id: raw.id,
    timestamp: raw.timestamp,
    items,
    results,
  }
}

function readHistoryFromLocalStorage(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => normalizeHistoryEntry(entry))
      .filter((entry): entry is HistoryEntry => Boolean(entry))
  } catch {
    return []
  }
}

function writeHistoryToLocalStorage(entries: HistoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    /* ignore quota / privacy errors */
  }
}

type SessionRow = {
  id: string
  user_id?: string
  items: unknown
  results: unknown
  created_at: string
}

function rowToEntry(row: SessionRow): HistoryEntry | null {
  return normalizeHistoryEntry({
    id: row.id,
    timestamp: row.created_at,
    items: row.items,
    results: row.results,
  })
}

/** Fetches sessions from Supabase and mirrors them into localStorage, then notifies subscribers. */
export function loadHistoryFromSupabaseOnStartup(): void {
  if (typeof window === 'undefined') return
  void (async () => {
    try {
      const userId = getUserId()
      if (!userId) return

      const { data, error } = await supabase
        .from('sessions')
        .select('id, items, results, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT)

      if (error) throw error

      const entries = (data as SessionRow[] | null)
        ?.map((row) => rowToEntry(row))
        .filter((entry): entry is HistoryEntry => Boolean(entry)) ?? []

      writeHistoryToLocalStorage(entries)
      emitHistory()
    } catch (err) {
      console.error(err)
    }
  })()
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  return readHistoryFromLocalStorage()
}

export function saveSession(items: Item[], results: RankedResult[]): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    items: items.map((item) => ({ ...item })),
    results: toHistoryResults(results),
  }

  const current = readHistoryFromLocalStorage()
  const next = [entry, ...current].slice(0, HISTORY_LIMIT)
  writeHistoryToLocalStorage(next)
  emitHistory()

  void (async () => {
    try {
      const userId = getUserId()
      if (!userId) return

      const { error } = await supabase.from('sessions').insert({
        id: entry.id,
        user_id: userId,
        items: entry.items,
        results: entry.results,
      })

      if (error) throw error
    } catch (err) {
      console.error(err)
    }
  })()

  return entry
}

export function deleteSession(id: string): void {
  const current = readHistoryFromLocalStorage()
  const next = current.filter((e) => e.id !== id)
  writeHistoryToLocalStorage(next)
  emitHistory()

  void (async () => {
    try {
      const userId = getUserId()
      if (!userId) return

      const { error } = await supabase.from('sessions').delete().eq('id', id).eq('user_id', userId)

      if (error) throw error
    } catch (err) {
      console.error(err)
    }
  })()
}
