'use client'

import type { Item, Pair } from '@/types'

type Props = {
  items: Item[]
  pairs: Pair[]
  choices: Record<number, number>
  compareIndex: number
  progress: { current: number; total: number }
  onVote: (pairIndex: number, winnerIndex: number) => void
  onBack: () => void
}

export function ComparePhase({
  items,
  pairs,
  choices,
  compareIndex,
  progress,
  onVote,
  onBack,
}: Props) {
  const pair = pairs[compareIndex]
  if (!pair) return null

  const a = items[pair.a]
  const b = items[pair.b]
  const selected = choices[compareIndex]
  const pct =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  const pick = (winnerIndex: number) => {
    onVote(compareIndex, winnerIndex)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="h-2 w-full bg-[#e5e5e5]" role="progressbar" aria-valuenow={progress.current} aria-valuemin={1} aria-valuemax={progress.total}>
        <div
          className="h-2 bg-black transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="font-mono text-sm text-[#666]">
        {progress.current} of {progress.total}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => pick(pair.a)}
          className={`flex min-h-[44px] flex-col items-start justify-center border border-[#e5e5e5] p-4 text-left transition-colors ${
            selected === pair.a
              ? 'border-black bg-black text-white'
              : 'bg-white text-black hover:border-black'
          }`}
        >
          <span className="font-mono text-2xl font-medium">{a.letter}</span>
          <span className="mt-1 text-base">{a.label}</span>
        </button>
        <button
          type="button"
          onClick={() => pick(pair.b)}
          className={`flex min-h-[44px] flex-col items-start justify-center border border-[#e5e5e5] p-4 text-left transition-colors ${
            selected === pair.b
              ? 'border-black bg-black text-white'
              : 'bg-white text-black hover:border-black'
          }`}
        >
          <span className="font-mono text-2xl font-medium">{b.letter}</span>
          <span className="mt-1 text-base">{b.label}</span>
        </button>
      </div>

      {compareIndex > 0 && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] border border-[#e5e5e5] bg-white px-4 text-black hover:border-black"
          >
            ← back
          </button>
        </div>
      )}
    </div>
  )
}
