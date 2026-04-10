'use client'

import { useState, type KeyboardEvent } from 'react'
import type { Item } from '@/types'

type Props = {
  items: Item[]
  maxItems: number
  onAdd: (label: string) => void
  onRemove: (index: number) => void
  onStartComparing: () => void
}

export function InputPhase({
  items,
  maxItems,
  onAdd,
  onRemove,
  onStartComparing,
}: Props) {
  const [value, setValue] = useState('')
  const remaining = maxItems - items.length
  const canStart = items.length >= 3

  const submit = () => {
    onAdd(value)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add a task or priority"
          className="min-h-[44px] flex-1 border border-[#e5e5e5] bg-white px-3 text-black placeholder:text-[#999] outline-none focus:border-black"
          aria-label="New item"
        />
        <button
          type="button"
          onClick={submit}
          className="min-h-[44px] border border-black bg-black px-4 text-white hover:bg-[#333] sm:shrink-0"
        >
          Add
        </button>
      </div>

      <p className="font-mono text-sm text-[#666]">
        {items.length} items — {remaining} more allowed
      </p>

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex min-h-[44px] items-center gap-2 border border-[#e5e5e5] bg-white px-2 py-1"
            >
              <span className="font-mono text-sm font-medium text-black">
                {item.letter}.
              </span>
              <span className="text-black">{item.label}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-1 min-h-[44px] min-w-[44px] text-sm text-[#666] hover:text-black"
                aria-label={`Remove ${item.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          type="button"
          disabled={!canStart}
          onClick={onStartComparing}
          className="min-h-[44px] border border-black bg-black px-4 text-white enabled:hover:bg-[#333] disabled:cursor-not-allowed disabled:border-[#e5e5e5] disabled:bg-[#e5e5e5] disabled:text-[#999]"
        >
          Start comparing →
        </button>
      </div>
    </div>
  )
}
