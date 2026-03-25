# Crystal Triangle — Cursor Project Brief

## What you are building

A priority-ranking web app based on the Crystal Triangle method. The user lists tasks, the app runs them through a pairwise comparison matrix (every item vs. every other item), tallies the votes, and surfaces the top 3 priorities underlined. Everything below the top 3 is marked deferred. The app is built to be used daily as a personal task prioritization tool, with a roadmap toward team/B2B use and PM app integrations.

---

## Method logic (core algorithm — own this clearly)

1. User enters 3–20 items
2. Each item is assigned a letter A–Z
3. App generates every unique pair: A vs B, A vs C... B vs C, B vs D... etc.
   - Total pairs for N items = N * (N - 1) / 2
4. User picks one item from each pair — whichever matters more right now
5. Tally wins per item
6. Sort by win count descending
7. Top 3 = priorities (displayed underlined)
8. Everything ranked 4th and below = deferred

The core logic lives in pure utility functions completely separate from UI components. This is non-negotiable for future API and plugin use.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Best AI tooling support, good defaults |
| Language | TypeScript | Catch errors early, better AI code gen |
| Styling | Tailwind CSS | Fast iteration, easy to override |
| Persistence (phase 1) | localStorage | Zero backend, works immediately |
| Persistence (phase 2) | Supabase | Auth + DB + API, free tier, AI knows it well |
| Deployment | Vercel | One-command deploy, free tier, GitHub integration |
| Package manager | npm | Keep it simple |

---

## Project structure

```
crystal-triangle/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Home — renders the app shell
│   └── globals.css         # Tailwind base + custom CSS vars
├── components/
│   ├── InputPhase.tsx      # Step 1: enter and manage items
│   ├── ComparePhase.tsx    # Step 2: pairwise comparison cards
│   └── ResultsPhase.tsx    # Step 3: ranked results display
├── lib/
│   └── crystalTriangle.ts  # ALL business logic — pure functions only, no React
├── hooks/
│   └── useCrystalTriangle.ts  # State management, bridges lib → components
├── types/
│   └── index.ts            # Shared TypeScript types
└── public/
    └── manifest.json       # PWA manifest
```

---

## Types (types/index.ts)

```typescript
export type Item = {
  id: string
  label: string
  letter: string
}

export type Pair = {
  a: number   // index into items array
  b: number
}

export type Session = {
  items: Item[]
  pairs: Pair[]
  choices: Record<number, number>  // pairIndex → winning item index
  phase: 'input' | 'compare' | 'results'
}

export type RankedResult = {
  item: Item
  votes: number
  rank: number
  isPriority: boolean   // true for top 3
  isDeferred: boolean   // true for rank 4+
}
```

---

## Core logic (lib/crystalTriangle.ts)

Implement these pure functions. No React, no imports from components, no side effects.

```typescript
// Assign letters A-Z to items
export function assignLetters(items: string[]): Item[]

// Generate all unique pairs
export function buildPairs(itemCount: number): Pair[]

// Given choices map, tally votes per item index
export function tallyVotes(pairs: Pair[], choices: Record<number, number>): Record<number, number>

// Sort by votes, assign ranks, flag top 3 vs deferred
export function rankResults(items: Item[], votes: Record<number, number>): RankedResult[]

// Convenience: run full ranking from raw inputs
export function runTriangle(items: string[], choices: Record<number, number>): RankedResult[]
```

---

## State hook (hooks/useCrystalTriangle.ts)

Single hook that owns all app state and exposes clean actions to components.

```typescript
// Exposes:
const {
  session,          // current Session object
  addItem,          // (label: string) => void
  removeItem,       // (index: number) => void
  startComparing,   // () => void — moves to compare phase
  vote,             // (pairIndex: number, winnerIndex: number) => void
  goBack,           // () => void — back one pair
  showResults,      // () => void
  restart,          // () => void — full reset
  results,          // RankedResult[] — computed from current session
  progress,         // { current: number, total: number }
} = useCrystalTriangle()
```

State persists to localStorage on every change. Key: `ct_session`.

---

## Components

### InputPhase
- Text input + Add button, Enter key submits
- Items render as chips with their assigned letter and a remove button
- Show count: "X items — Y more allowed" (max 20)
- "Start comparing →" button disabled until 3+ items
- No textarea — one item at a time for clarity

### ComparePhase
- Progress bar at top (current pair / total pairs)
- One card at a time showing both options side by side
- Each option shows: large letter, item text
- Tap/click to select — immediately advances to next pair
- Previously chosen option shows as selected if user navigates back
- "← back" button visible after first pair
- Pair counter: "3 of 21"

### ResultsPhase
- Ranked list, all items shown
- Top 3: rank label (1st/2nd/3rd), underlined item text, vote bar filled dark
- Rank 4+: muted rank, normal text, lighter vote bar
- "Deferred" section label above rank 4+ items
- Vote count shown on each row
- Buttons: "Start over" and "← revise comparisons"

---

## PWA setup

Add to `app/layout.tsx` metadata:
```typescript
export const metadata = {
  title: 'Crystal Triangle',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: { capable: true, statusBarStyle: 'default' }
}
```

`public/manifest.json`:
```json
{
  "name": "Crystal Triangle",
  "short_name": "CT",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Design direction

Clean, minimal, utilitarian. This is a daily-use tool — zero decoration, maximum clarity. No gradients, no shadows, no color splashes. Black and white with one neutral gray for secondary elements.

- Font: system-ui or a clean monospace for letters/counts
- Background: white
- Primary text: black
- Secondary text: #666
- Borders: 1px solid #e5e5e5
- Selected/active state: black background, white text
- Progress bar: black fill on light gray track
- Priority items: underlined, font-weight 500
- Deferred items: color #999, normal weight
- Mobile-first sizing: touch targets minimum 44px height

The designer (me) will handle all visual polish after the scaffold is working. Build it functional and clean — do not add decorative elements.

---

## What to build in this session

1. Scaffold the Next.js project with TypeScript and Tailwind
2. Create the folder structure above
3. Implement `lib/crystalTriangle.ts` — all pure functions with TypeScript types
4. Implement `hooks/useCrystalTriangle.ts` with localStorage persistence
5. Build all three components (InputPhase, ComparePhase, ResultsPhase)
6. Wire everything together in `app/page.tsx`
7. Add PWA manifest and metadata
8. Confirm it runs locally with `npm run dev`

Do not add Supabase, authentication, or API routes in this session. localStorage only for now.

---

## Future phases (context only — do not build yet)

- **Phase 2**: Supabase auth + cloud sync — sessions persist across devices
- **Phase 3**: REST API — `POST /api/rank` accepts items array, returns ranked results
- **Phase 4**: Team mode — multiple users vote on shared item set, app surfaces agreement/divergence
- **Phase 5**: PM app plugins — Jira, Linear, Notion integrations via OAuth

The pure function architecture in `lib/crystalTriangle.ts` is the foundation for all of these. Protect it.

---

## First command for Cursor

> Scaffold a new Next.js 14 project with TypeScript and Tailwind CSS using the App Router. Create the folder structure in this brief exactly. Implement all pure functions in lib/crystalTriangle.ts, the state hook in hooks/useCrystalTriangle.ts with localStorage persistence, and all three components. Wire them into app/page.tsx. Add PWA manifest. Design should be clean and minimal — black, white, and gray only. Do not add any backend, auth, or database. Confirm it runs with npm run dev.
