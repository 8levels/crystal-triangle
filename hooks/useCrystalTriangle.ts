'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { assignLetters, buildPairs, rankResults, tallyVotes } from '@/lib/crystalTriangle'
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
    if (!parsed?.session || typeof parsed.compareIndex !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function useCrystalTriangle() {
  const [state, setState] = useState<AppState>(initialAppState)
  const [hydrated, setHydrated] = useState(false)

  const session = state.session
  const compareIndex = state.compareIndex

  useEffect(() => {
    const stored = loadStored()
    if (stored) setState(stored)
    setHydrated(true)
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
        session: { ...prev.session, items: mergeLetters(next) },
      }
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
    return rankResults(session.items, votes)
  }, [session])

  const progress = useMemo(() => {
    if (session.phase !== 'compare') return { current: 0, total: 0 }
    return { current: compareIndex + 1, total: session.pairs.length }
  }, [session.phase, compareIndex, session.pairs.length])

  return {
    session,
    compareIndex,
    addItem,
    removeItem,
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
