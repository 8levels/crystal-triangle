'use client'

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  onReorder: (activeId: string, overId: string) => void
  onSetDone: (itemId: string, done: boolean) => void
  onRestart: () => void
  onRevise: () => void
}

type RowProps = {
  result: RankedResult
  maxVotes: number
  onSetDone: (itemId: string, done: boolean) => void
}

function SortableResultRow({ result, maxVotes, onSetDone }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: result.item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-1 border border-[#e5e5e5] p-3 ${result.isDone ? 'opacity-40' : ''} ${
        isDragging ? 'bg-[#fafafa]' : 'bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(result.isDone)}
          onChange={(e) => onSetDone(result.item.id, e.target.checked)}
          className="h-4 w-4"
          aria-label={`Mark ${result.item.label} done`}
        />
        <button
          type="button"
          aria-label={`Drag ${result.item.label}`}
          className="min-h-[32px] min-w-[32px] cursor-grab font-mono text-sm text-[#666] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ≡
        </button>
        <div className="flex flex-1 items-baseline justify-between gap-4">
          <span className={`font-mono text-sm ${result.isDeferred ? 'text-[#999]' : 'text-[#666]'}`}>
            {ordinal(result.rank)}
          </span>
          <span className={`text-right font-mono text-sm ${result.isDeferred ? 'text-[#999]' : 'text-[#666]'}`}>
            {result.votes} {result.votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>
      <p
        className={`${
          result.isPriority
            ? 'font-medium text-black underline decoration-black underline-offset-2'
            : 'font-normal text-[#999]'
        } ${result.isDone ? 'line-through' : ''}`}
      >
        <span className="font-mono">{result.item.letter}. </span>
        {result.item.label}
      </p>
      <div className="h-2 w-full bg-[#e5e5e5]">
        <div
          className={`h-2 ${result.isPriority ? 'bg-black' : 'bg-[#ccc]'}`}
          style={{
            width: maxVotes ? `${(result.votes / maxVotes) * 100}%` : '0%',
          }}
        />
      </div>
    </li>
  )
}

export function ResultsPhase({ results, onReorder, onSetDone, onRestart, onRevise }: Props) {
  const maxVotes = Math.max(0, ...results.map((r) => r.votes))
  const doneCount = results.filter((r) => r.isDone).length
  const sensors = useSensors(useSensor(PointerSensor))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  return (
    <div className="flex flex-col gap-8">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={results.map((r) => r.item.id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-3">
            {results.map((result) => (
              <SortableResultRow
                key={result.item.id}
                result={result}
                maxVotes={maxVotes}
                onSetDone={onSetDone}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <p className="text-sm text-[#666]">
        {doneCount} of {results.length} done
      </p>

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
