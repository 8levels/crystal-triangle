'use client'

import type { RankedResult } from '@/types'

function ordinal(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return `${n}st`
  if (j === 2 && k !== 12) return `${n}nd`
  if (j === 3 && k !== 13) return `${n}rd`
  return `${n}th`
}

type Props = {
  results: RankedResult[]
  onRestart: () => void
  onRevise: () => void
}

export function ResultsPhase({ results, onRestart, onRevise }: Props) {
  const maxVotes = Math.max(0, ...results.map((r) => r.votes))
  const priorities = results.filter((r) => r.isPriority)
  const deferred = results.filter((r) => r.isDeferred)

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[#666]">
          Priorities
        </h2>
        <ol className="flex flex-col gap-4">
          {priorities.map((r) => (
            <li key={r.item.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-sm text-[#666]">
                  {ordinal(r.rank)}
                </span>
                <span className="text-right font-mono text-sm text-[#666]">
                  {r.votes} {r.votes === 1 ? 'vote' : 'votes'}
                </span>
              </div>
              <p className="font-medium text-black underline decoration-black underline-offset-2">
                {r.item.label}
              </p>
              <div className="h-2 w-full bg-[#e5e5e5]">
                <div
                  className="h-2 bg-black"
                  style={{
                    width: maxVotes ? `${(r.votes / maxVotes) * 100}%` : '0%',
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {deferred.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[#666]">
            Deferred
          </h2>
          <ol className="flex flex-col gap-4">
            {deferred.map((r) => (
              <li key={r.item.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-sm text-[#999]">
                    {ordinal(r.rank)}
                  </span>
                  <span className="text-right font-mono text-sm text-[#999]">
                    {r.votes} {r.votes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                <p className="font-normal text-[#999]">{r.item.label}</p>
                <div className="h-2 w-full bg-[#e5e5e5]">
                  <div
                    className="h-2 bg-[#ccc]"
                    style={{
                      width: maxVotes ? `${(r.votes / maxVotes) * 100}%` : '0%',
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onRestart}
          className="min-h-[44px] border border-black bg-black px-4 text-white hover:bg-[#333]"
        >
          Start over
        </button>
        <button
          type="button"
          onClick={onRevise}
          className="min-h-[44px] border border-[#e5e5e5] bg-white px-4 text-black hover:border-black"
        >
          ← revise comparisons
        </button>
      </div>
    </div>
  )
}
