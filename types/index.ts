export type Item = {
  id: string
  label: string
  letter: string
}

export type Pair = {
  a: number
  b: number
}

export type Session = {
  items: Item[]
  pairs: Pair[]
  choices: Record<number, number>
  phase: 'input' | 'compare' | 'results'
}

export type RankedResult = {
  item: Item
  votes: number
  rank: number
  isPriority: boolean
  isDeferred: boolean
}

export type HistoryRankedResult = {
  rank: number
  letter: string
  label: string
  votes: number
  isPriority: boolean
  isDeferred: boolean
}

export type HistoryEntry = {
  id: string
  timestamp: string
  items: Item[]
  results: HistoryRankedResult[]
}
