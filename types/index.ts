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
