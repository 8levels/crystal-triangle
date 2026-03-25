import type { Item, Pair, RankedResult } from '@/types'

export function assignLetters(labels: string[]): Item[] {
  return labels.map((label, i) => ({
    id: `item-${i}`,
    label,
    letter: String.fromCharCode(65 + i),
  }))
}

export function buildPairs(itemCount: number): Pair[] {
  const pairs: Pair[] = []
  for (let i = 0; i < itemCount; i++) {
    for (let j = i + 1; j < itemCount; j++) {
      pairs.push({ a: i, b: j })
    }
  }
  return pairs
}

export function tallyVotes(
  pairs: Pair[],
  choices: Record<number, number>
): Record<number, number> {
  const counts: Record<number, number> = {}
  for (let i = 0; i < pairs.length; i++) {
    const winner = choices[i]
    if (winner === undefined) continue
    counts[winner] = (counts[winner] ?? 0) + 1
  }
  return counts
}

export function rankResults(
  items: Item[],
  votes: Record<number, number>
): RankedResult[] {
  const indices = items.map((_, i) => i)
  indices.sort((a, b) => {
    const va = votes[a] ?? 0
    const vb = votes[b] ?? 0
    if (vb !== va) return vb - va
    return a - b
  })

  return indices.map((itemIndex, order) => {
    const rank = order + 1
    const v = votes[itemIndex] ?? 0
    return {
      item: items[itemIndex],
      votes: v,
      rank,
      isPriority: rank <= 3,
      isDeferred: rank >= 4,
    }
  })
}

export function runTriangle(
  labels: string[],
  choices: Record<number, number>
): RankedResult[] {
  const items = assignLetters(labels)
  const pairs = buildPairs(items.length)
  const tallied = tallyVotes(pairs, choices)
  return rankResults(items, tallied)
}
