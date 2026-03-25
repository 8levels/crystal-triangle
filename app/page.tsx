"use client";

import { useEffect, useMemo, useState } from "react";
import { ComparePhase } from "@/components/ComparePhase";
import { InputPhase } from "@/components/InputPhase";
import { ResultsPhase } from "@/components/ResultsPhase";
import { useCrystalTriangle } from "@/hooks/useCrystalTriangle";
import { loadHistory } from "@/lib/history";
import type { HistoryEntry } from "@/types";

const MAX_ITEMS = 20;
const HISTORY_KEY = "ct_history";

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function formatHistoryDate(value: string): string {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .toLowerCase();
  return `${datePart} · ${timePart}`;
}

export default function Home() {
  const {
    session,
    compareIndex,
    addItem,
    removeItem,
    startComparing,
    vote,
    goBack,
    restart,
    reviseComparisons,
    results,
    progress,
  } = useCrystalTriangle();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>(
    {}
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, [session.phase, results.length]);

  const toggleEntry = (entryId: string) => {
    setExpandedHistory((prev) => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const deleteEntry = (entryId: string) => {
    const next = history.filter((entry) => entry.id !== entryId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
    setExpandedHistory((prev) => {
      const copy = { ...prev };
      delete copy[entryId];
      return copy;
    });
  };

  const hasHistory = useMemo(() => history.length > 0, [history.length]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-10 border-b border-[#e5e5e5] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Crystal Triangle
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          Add tasks, compare every pair, surface your top three priorities.
        </p>
      </header>

      <section className="mb-10 border border-[#e5e5e5] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[#666]">
            History
          </h2>
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="min-h-[44px] border border-[#e5e5e5] px-4 text-sm text-black hover:border-black"
          >
            {historyOpen ? "Hide history" : "Show history"}
          </button>
        </div>

        {historyOpen && (
          <div className="mt-4">
            {!hasHistory && (
              <p className="text-sm text-[#666]">No saved sessions yet.</p>
            )}

            {hasHistory && (
              <ul className="flex flex-col gap-4">
                {history.map((entry) => {
                  const topThree = entry.results
                    .filter((r) => r.isPriority)
                    .slice(0, 3);
                  const maxVotes = Math.max(
                    0,
                    ...entry.results.map((r) => r.votes)
                  );
                  const isExpanded = Boolean(expandedHistory[entry.id]);

                  return (
                    <li key={entry.id} className="border border-[#e5e5e5] p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-[#666]">
                          {formatHistoryDate(entry.timestamp)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleEntry(entry.id)}
                            className="min-h-[44px] border border-[#e5e5e5] px-3 text-sm text-black hover:border-black"
                          >
                            {isExpanded ? "hide" : "view"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            className="min-h-[44px] border border-[#e5e5e5] px-3 text-sm text-black hover:border-black"
                          >
                            delete
                          </button>
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-black">
                        {topThree.map((item, index) => (
                          <span key={`${entry.id}-${item.rank}`}>
                            <span className="underline decoration-black underline-offset-2">
                              {item.label}
                            </span>
                            {index < topThree.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>

                      {isExpanded && (
                        <ol className="mt-4 flex flex-col gap-3">
                          {entry.results.map((r) => (
                            <li key={`${entry.id}-${r.rank}-${r.letter}`} className="flex flex-col gap-1">
                              <div className="flex items-baseline justify-between gap-4">
                                <span
                                  className={`font-mono text-sm ${
                                    r.isDeferred ? "text-[#999]" : "text-[#666]"
                                  }`}
                                >
                                  {ordinal(r.rank)}
                                </span>
                                <span
                                  className={`text-right font-mono text-sm ${
                                    r.isDeferred ? "text-[#999]" : "text-[#666]"
                                  }`}
                                >
                                  {r.votes} {r.votes === 1 ? "vote" : "votes"}
                                </span>
                              </div>
                              <p
                                className={`${
                                  r.isPriority
                                    ? "font-medium text-black underline decoration-black underline-offset-2"
                                    : "font-normal text-[#999]"
                                }`}
                              >
                                <span className="font-mono">{r.letter}. </span>
                                {r.label}
                              </p>
                              <div className="h-2 w-full bg-[#e5e5e5]">
                                <div
                                  className={`h-2 ${
                                    r.isPriority ? "bg-black" : "bg-[#ccc]"
                                  }`}
                                  style={{
                                    width: maxVotes
                                      ? `${(r.votes / maxVotes) * 100}%`
                                      : "0%",
                                  }}
                                />
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>

      {session.phase === "input" && (
        <InputPhase
          items={session.items}
          maxItems={MAX_ITEMS}
          onAdd={addItem}
          onRemove={removeItem}
          onStartComparing={startComparing}
        />
      )}

      {session.phase === "compare" && session.pairs.length > 0 && (
        <ComparePhase
          items={session.items}
          pairs={session.pairs}
          choices={session.choices}
          compareIndex={Math.min(compareIndex, session.pairs.length - 1)}
          progress={progress}
          onVote={vote}
          onBack={goBack}
        />
      )}

      {session.phase === "results" && (
        <ResultsPhase
          results={results}
          onRestart={restart}
          onRevise={reviseComparisons}
        />
      )}
    </div>
  );
}
