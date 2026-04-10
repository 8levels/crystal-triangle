'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { assignLetters, buildPairs, rankResults, tallyVotes } from '@/lib/crystalTriangle'
import { loadHistoryFromSupabaseOnStartup, saveSession } from '@/lib/history'
import { recordToday } from '@/lib/streak'
import type { Item, RankedResult, Session } from '@/types'

const STORAGE_KEY = 'ct_session'

type AppState = {
  session: Session
  compareIndex: number
}

const initialAppState: AppState = {
  session: {
    items: [],
    pairs: [],
    choices: {},
    phase: 'input',
    resultOrder: [],
    doneItems: {},
  },
  compareIndex: 0,
}

function mergeLetters(items: Item[]): Item[] {
  const labels = items.map((i) => i.label)
  const assigned = assignLetters(labels)
  return items.map((item, i) => ({ ...item, letter: assigned[i].letter }))
}

function loadStored(): AppState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    if (!parsed?.session) return null
    return {
      session: parsed.session,
      compareIndex: typeof parsed.compareIndex === 'number' ? parsed.compareIndex : 0,
    }
  } catch {
    return null
  }
}

export function useCrystalTriangle() {
  const [state, setState] = useState<AppState>(initialAppState)
  const [hydrated, setHydrated] = useState(false)
  const previousPhaseRef = useRef<Session['phase']>('input')

  const session = state.session
  const compareIndex = state.compareIndex

  useEffect(() => {
    const stored = loadStored()
    if (stored) {
      setState(stored)
      previousPhaseRef.current = stored.session.phase
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    loadHistoryFromSupabaseOnStartup()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const addItem = useCallback((label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return
    setState((prev) => {
      if (prev.session.items.length >= 20) return prev
      const nextItems: Item[] = [
        ...prev.session.items,
        { id: crypto.randomUUID(), label: trimmed, letter: 'A' },
      ]
      return {
        ...prev,
        session: {
          ...prev.session,
          items: mergeLetters(nextItems),
          resultOrder: [],
          doneItems: {},
        },
      }
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.session.items.length) return prev
      const next = prev.session.items.filter((_, i) => i !== index)
      return {
        ...prev,
        session: {
          ...prev.session,
          items: mergeLetters(next),
          resultOrder: [],
          doneItems: {},
        },
      }
    })
  }, [])

  const rerunWithItems = useCallback((labels: string[]) => {
    const sanitized = labels.map((v) => v.trim()).filter(Boolean).slice(0, 20)
    const items = assignLetters(sanitized).map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }))

    setState({
      session: {
        items,
        pairs: [],
        choices: {},
        phase: 'input',
        resultOrder: [],
        doneItems: {},
      },
      compareIndex: 0,
    })
  }, [])

  const startComparing = useCallback(() => {
    setState((prev) => {
      if (prev.session.items.length < 3) return prev
      const pairs = buildPairs(prev.session.items.length)
      return {
        session: {
          ...prev.session,
          pairs,
          choices: {},
          phase: 'compare',
          resultOrder: [],
          doneItems: {},
        },
        compareIndex: 0,
      }
    })
  }, [])

  const vote = useCallback((pairIndex: number, winnerIndex: number) => {
    setState((prev) => {
      if (prev.session.phase !== 'compare') return prev
      const last = prev.session.pairs.length - 1
      const nextChoices = { ...prev.session.choices, [pairIndex]: winnerIndex }
      if (pairIndex === last) {
        return {
          session: {
            ...prev.session,
            choices: nextChoices,
            phase: 'results',
          },
          compareIndex: prev.compareIndex,
        }
      }
      return {
        session: { ...prev.session, choices: nextChoices },
        compareIndex: pairIndex + 1,
      }
    })
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      compareIndex: prev.compareIndex > 0 ? prev.compareIndex - 1 : 0,
    }))
  }, [])

  const showResults = useCallback(() => {
    setState((prev) =>
      prev.session.phase === 'compare'
        ? {
            ...prev,
            session: { ...prev.session, phase: 'results' },
          }
        : prev
    )
  }, [])

  const restart = useCallback(() => {
    setState(initialAppState)
  }, [])

  const reviseComparisons = useCallback(() => {
    setState((prev) =>
      prev.session.phase === 'results'
        ? {
            ...prev,
            session: { ...prev.session, phase: 'compare' },
            compareIndex: 0,
          }
        : prev
    )
  }, [])

  const results: RankedResult[] = useMemo(() => {
    if (session.phase !== 'results' || session.items.length === 0) return []
    const votes = tallyVotes(session.pairs, session.choices)
    const baseResults = rankResults(session.items, votes)
    const byId = new Map(baseResults.map((result) => [result.item.id, result]))
    const baseOrder = baseResults.map((result) => result.item.id)
    const orderedIds = [
      ...(session.resultOrder ?? []).filter((id) => byId.has(id)),
      ...baseOrder.filter((id) => !(session.resultOrder ?? []).includes(id)),
    ]

    const withDone: RankedResult[] = []
    for (const id of orderedIds) {
      const result = byId.get(id)
      if (!result) continue
      withDone.push({
        ...result,
        isDone: Boolean(session.doneItems?.[id]),
      })
    }

    const undone = withDone.filter((result) => !result.isDone)
    const done = withDone.filter((result) => result.isDone)
    const merged = [...undone, ...done]

    return merged.map((result, index) => {
      const rank = index + 1
      return {
        ...result,
        rank,
        isPriority: rank <= 3,
        isDeferred: rank >= 4,
      }
    })
  }, [session])

  const reorderResults = useCallback((activeId: string, overId: string) => {
    setState((prev) => {
      if (prev.session.phase !== 'results') return prev
      const votes = tallyVotes(prev.session.pairs, prev.session.choices)
      const baseResults = rankResults(prev.session.items, votes)
      const baseIds = baseResults.map((result) => result.item.id)
      const existingOrder = prev.session.resultOrder ?? baseIds
      const order = [
        ...existingOrder.filter((id) => baseIds.includes(id)),
        ...baseIds.filter((id) => !existingOrder.includes(id)),
      ]
      const doneItems = prev.session.doneItems ?? {}
      const visible = [
        ...order.filter((id) => !doneItems[id]),
        ...order.filter((id) => doneItems[id]),
      ]
      const from = visible.indexOf(activeId)
      const to = visible.indexOf(overId)
      if (from === -1 || to === -1 || from === to) return prev

      const nextVisible = [...visible]
      const [moved] = nextVisible.splice(from, 1)
      nextVisible.splice(to, 0, moved)

      return {
        ...prev,
        session: {
          ...prev.session,
          resultOrder: nextVisible,
        },
      }
    })
  }, [])

  const setResultDone = useCallback((itemId: string, done: boolean) => {
    setState((prev) => {
      if (prev.session.phase !== 'results') return prev
      return {
        ...prev,
        session: {
          ...prev.session,
          doneItems: {
            ...(prev.session.doneItems ?? {}),
            [itemId]: done,
          },
        },
      }
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const previousPhase = previousPhaseRef.current
    const didTransitionToResults =
      previousPhase !== 'results' && session.phase === 'results'

    if (didTransitionToResults && results.length > 0) {
      saveSession(session.items, results)
      recordToday()
    }

    previousPhaseRef.current = session.phase
  }, [session.phase, session.items, results, hydrated])

  const progress = useMemo(() => {
    if (session.phase !== 'compare') return { current: 0, total: 0 }
    return { current: compareIndex + 1, total: session.pairs.length }
  }, [session.phase, compareIndex, session.pairs.length])

  return {
    session,
    compareIndex,
    addItem,
    removeItem,
    rerunWithItems,
    reorderResults,
    setResultDone,
    startComparing,
    vote,
    goBack,
    showResults,
    restart,
    reviseComparisons,
    results,
    progress,
  }
}
