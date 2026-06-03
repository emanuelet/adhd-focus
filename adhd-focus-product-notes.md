# ADHD Focus — Product Notes from First-Principles ADHD Research
> Addendum to adhd-focus-plan.md + adhd-focus-plan-patch.md.
> Maps insights from Noah Ryan's ADHD workflow article to concrete product decisions.

---

## Insight → Feature Map

| Insight | What it means for the product |
|---|---|
| Dopamine regulation issue, not deficiency | Stimuli reduction before work matters — add a pre-flight ritual |
| Works in 2hr sprints at 110%, not 25-min ticks | Pomodoro is too short; make session length configurable |
| Temporal blindness — batch by TIME not task | Show time budget per day, not just task count |
| Can't start tasks, can prepare for them | Add a "just prepare" friction-lowering entry into any task |
| Non-linear thinking — ideas chain into ideas | Capture drawer needs idea-chaining, not just isolated notes |
| Daily strategic review — document what worked | End-of-day review screen, not just a done count |
| Energy flows vary by time of day | Energy tags should include time-of-day affinity, not just level |
| Quick wins build momentum | Surface sub-5-min tasks as a separate "quick wins" queue |
| Gamify everything | Make the done list and streaks feel like a game, not a log |
| Full plate forces 80/20 prioritisation | The 3-task constraint is already correct — reinforce it harder |

---

## Feature Changes

### 1. Replace fixed Pomodoro with configurable Sprint Sessions

The article is clear: 25-minute Pomodoros are a neurotypical tool. ADHD brains
hyperfocus for 90–120 minutes when properly primed, or not at all.

**Change:** Pomodoro timer becomes a Sprint timer with selectable durations.

```typescript
// src/types/sprint.ts
export type SprintLength = 25 | 52 | 90 | 120  // minutes

export interface Sprint {
  taskId:    string
  length:    SprintLength
  startedAt: string          // ISO
  phase:     'work' | 'break' | 'idle'
}
```

UI: when starting a focus session, show duration picker before starting:
```
▶ Start sprint
[25 min]  [52 min]  [90 min]  [2 hr]
```

Break duration scales with sprint: 25→5, 52→10, 90→15, 120→20.

Store the selected length in `usePomodoro` state. Default: 52 minutes
(research-backed ultradian rhythm, not the arbitrary 25).

---

### 2. Pre-Flight Checklist (Stimuli Reduction Ritual)

> "Apples taste great when you're hungry, not so much when you just housed poptarts."

Before a sprint starts, show a quick checklist the user taps through.
The act of checking it off IS the ritual — it primes the brain for hyperfocus.

**New component:** `src/components/focus/PreFlightModal.tsx`

Opens when the user hits ▶ Start Sprint (before the duration picker).

```typescript
// Hardcoded items — not configurable in v1
const PREFLIGHT_ITEMS = [
  { id: 'phone',  label: 'Phone face-down or in another room' },
  { id: 'sites',  label: 'Distracting sites blocked'          },
  { id: 'water',  label: 'Water + anything you need is nearby' },
  { id: 'ritual', label: 'Work ritual started (music, coffee, etc.)' },
]
```

Each item is a checkbox. A "Start sprint →" button appears only when all 4 are checked.
The modal can be dismissed with "Skip ritual" for when the user is already in flow.

Store `preflight_skipped_count` in localStorage as a soft nudge: "You've skipped your
ritual 3 times this week."

---

### 3. Energy Tags: Add Time-of-Day Affinity

> "I layer activities based on my natural energy flows — busy work in the morning,
> research at night, writing after exercise."

**Change:** Expand the `EnergyLevel` type to include time affinity as a second
orthogonal dimension.

```typescript
// src/types/todoist.ts
export type EnergyLevel   = 'low' | 'med' | 'high'
export type TimeOfDay     = 'morning' | 'afternoon' | 'evening' | 'anytime'

// Stored together
export interface TaskMeta {
  energy?:    EnergyLevel
  timeOfDay?: TimeOfDay
}
```

DB change: rename `energy_tags` table to `task_meta`, add `time_of_day` column:

```sql
ALTER TABLE energy_tags RENAME TO task_meta;
ALTER TABLE task_meta ADD COLUMN time_of_day TEXT
  CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime'));
```

**Inbox smart filter:** Add a "Right now" filter button at the top of the inbox.
When pressed, filters tasks whose `timeOfDay` matches the current hour:
- 05:00–11:59 → morning
- 12:00–16:59 → afternoon
- 17:00–23:59 → evening

This surfaces the right tasks at the right time without the user having to think.

---

### 4. Task Runway ("Just Prepare" Mode)

> "I needed to write this article, but I got major writer's block. So instead I started
> preparing to write this article later. Before I knew it, I was 1,000 words in."

**The insight:** the brain can't START a task but CAN start preparing for one.
Lower the activation energy by reframing "do it" as "just set it up."

**New UI element on TaskSlot:** A "↓ Break it down" button below the task title.
Tapping it opens an inline mini-notepad showing sub-steps for that task.
Steps are stored in the captures table with a `parent_task_id` foreign key.

```sql
ALTER TABLE captures ADD COLUMN parent_task_id TEXT;
```

The mini-notepad has no start button, no pressure — just a list of prep steps.
The psychological trick: once you're writing prep steps, you're already doing the task.

Steps can optionally be promoted to Todoist as sub-tasks via the existing
`createTodoistTask` server function.

---

### 5. Quick Wins Queue

> "Anything that takes me less than 5 minutes to do, I do immediately.
> This clears up headspace and builds accomplishment momentum."

**New inbox section:** Tasks labelled `quick` (a Todoist label) OR tasks the user
manually tags as "< 5 min" in the app appear in a "Quick wins" section at the top
of the inbox — visually separated from the main backlog.

Implementation:
- Check for Todoist label `quick` on tasks: `task.labels.includes('quick')`
- OR allow manual tagging via a ⚡ button on inbox rows (stored in `task_meta`)
- Surface these in a sticky top section of InboxView with a distinct background

```typescript
// InboxView.tsx
const quickWins  = inbox.filter(t => t.labels.includes('quick') || taskMeta[t.id]?.isQuick)
const mainInbox  = inbox.filter(t => !quickWins.includes(t))
```

Completing a quick win plays a more enthusiastic animation/sound than a regular task.

---

### 6. End-of-Day Review Screen

> "I assess my performance at the end of the day. I document what I did well and
> want to replicate tomorrow, as well as areas I can improve."

**New tab: "Review"** (replaces or sits alongside "Done").

Appears after 17:00 or when user taps "End day" button.

Three sections:
1. **Today's wins** — done list with sprint times shown (e.g. "3 tasks · 2 sprints · 1h 44m focused")
2. **Replicate tomorrow** — free-text field: "What worked today that I want to do again?"
3. **Improve** — free-text field: "What got in the way? What would I do differently?"

Review entries stored in a new `daily_reviews` table:
```sql
CREATE TABLE IF NOT EXISTS daily_reviews (
  date         DATE        PRIMARY KEY,
  wins_note    TEXT,
  improve_note TEXT,
  total_sprints INT        NOT NULL DEFAULT 0,
  total_focus_mins INT     NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Sprint stats are written here when a sprint completes (update `total_sprints`,
`total_focus_mins` via a server function called from `usePomodoro` on phase transition
from `work` → `break`).

---

### 7. Gamify the Done List

> "Like everything in my life, I gamify it. Taking things seriously has never worked
> for me. The more playful I am, the better my results."

**Changes to DoneView:**

Replace the plain struck-through list with:
- A streak counter: "🔥 Day 3 in a row — you've hit your 3 tasks"
  (stored in a `streaks` column on `daily_state`)
- Sprint badges on completed tasks: "✓ Filed invoice · ⚡ 52-min sprint"
- A progress bar: tasks done today vs. personal best (rolling 30-day max)
- A daily tagline generated from the done count — replace boring "3 tasks done" with
  something energising:
  ```typescript
  const TAGLINES = [
    [0, "The day is young."],
    [1, "First blood. Keep going."],
    [2, "Momentum building."],
    [3, "Three deep. That's a real day."],
    [4, "You're in the zone now."],
    [5, "Locked in. Legendary pace."],
  ]
  ```
  Match by `doneCount >= threshold`, pick last match.

---

## Design Principle Changes to Existing Features

### Capture Drawer: Make It Truly Frictionless

> "Non-linear thinkers. One idea sparks another. Keep it as frictionless as possible.
> Doodle on napkins if you have to."

The drawer should open in under 100ms and the cursor should land in the textarea
immediately. No confirmation dialogs. No labels or categories on capture.
Saved captures should appear instantly (already optimistic — keep it).

Add **idea chaining**: after saving a capture, the textarea clears but the drawer
stays open and shifts focus back to the input — ready for the next thought.
A "done capturing" button closes it. Default: stay open for rapid-fire capture.

```typescript
// CaptureDrawer.tsx
const handleSave = () => {
  saveCapture(capInput)
  setCapInput('')
  capRef.current?.focus()   // stay open, cursor ready for next thought
  // Don't close the drawer
}
```

### 3-Task Limit: Make It Visceral

> "Pressure creates diamonds. Force focus on the 20% that yields 80%."

The empty slots should feel more like a commitment mechanism than a to-do list.
When all 3 are filled, the Today view header changes to:
```
"Locked in. These are your only jobs today."
```

When 0 are filled:
```
"What are the 3 things that would make today a win?"
```

Reinforce that everything else is noise.

---

## Updated DB Schema Summary

These are the only schema additions on top of the main plan:

```sql
-- Rename energy_tags → task_meta, add columns
ALTER TABLE energy_tags RENAME TO task_meta;
ALTER TABLE task_meta ADD COLUMN time_of_day TEXT
  CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime'));
ALTER TABLE task_meta ADD COLUMN is_quick BOOLEAN NOT NULL DEFAULT FALSE;

-- Add parent_task_id to captures (for runway sub-steps)
ALTER TABLE captures ADD COLUMN parent_task_id TEXT;

-- Add daily review
CREATE TABLE IF NOT EXISTS daily_reviews (
  date              DATE        PRIMARY KEY,
  wins_note         TEXT,
  improve_note      TEXT,
  total_sprints     INT         NOT NULL DEFAULT 0,
  total_focus_mins  INT         NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add streak + best to daily_state
ALTER TABLE daily_state ADD COLUMN streak_days   INT NOT NULL DEFAULT 0;
ALTER TABLE daily_state ADD COLUMN tasks_best_30 INT NOT NULL DEFAULT 0;
```

---

## What NOT to Build (Scope Guard)

These insights were considered and deliberately excluded from v1:

| Insight | Why excluded |
|---|---|
| Full automation/outsourcing workflow | Out of scope — this is a task UI, not a life OS |
| Mindmapping / whiteboard feature | Already served by Todoist; duplication |
| Nootropics / supplement tracking | Out of scope |
| Full gamification system with XP/levels | Risk of the game becoming the goal; keep it subtle |

---

## Phase Additions

Add these phases after Phase 7 (Core UI) in the main plan:

### Phase 7b — Sprint + Pre-Flight (2–3 hrs)
```
Wire configurable sprint lengths into usePomodoro (replace POMO constant)
Build PreFlightModal component
Add sprint length picker to TaskSlot focus button flow
Store sprint stats → daily_reviews on phase completion
```

### Phase 7c — Task Meta + Quick Wins (1–2 hrs)
```
Rename energy_tags → task_meta, add time_of_day + is_quick columns
Update setEnergy server function to handle full TaskMeta
Update EnergyPicker to include TimeOfDay selector
Add "Right now" filter to InboxView
Add Quick Wins section to InboxView
```

### Phase 7d — Runway + End-of-Day (2–3 hrs)
```
Add parent_task_id to captures table
Build inline TaskRunway component for TaskSlot
Build ReviewView (new tab alongside Done)
Add daily_reviews table and server functions
Add streak tracking to daily_state
```

### Phase 7e — Gamification + Body Doubling (1 hr)
```
Update DoneView with streak, taglines, sprint badges
Update capture drawer to stay open after save (idea chaining)
Update 3-task header copy to be visceral
```
