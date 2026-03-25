"use client";

import { ComparePhase } from "@/components/ComparePhase";
import { InputPhase } from "@/components/InputPhase";
import { ResultsPhase } from "@/components/ResultsPhase";
import { useCrystalTriangle } from "@/hooks/useCrystalTriangle";

const MAX_ITEMS = 20;

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
