# Holiday Pause — backend handoff (for Viktor)

**Goal:** On team holidays (no-work US holidays) the timed games freeze for that shift and resume on the next working shift, the same way weekends already work. Front-end is done (`holidays.js`). Keep the backend work as small as possible.

## Rule

- A shift belongs to its **US Eastern date** (the shift runs 8 AM to 4 PM ET, so its ET date is fixed). Example: `2026-11-26` = the shift that starts Thu Nov 26, 10 PM PHT.
- A shift is **off** if its ET date is a Saturday, a Sunday, or on the holiday list.
- Mode is always **Skip & extend**: nothing happens on an off shift, and anything scheduled moves to the next working shift.

## 1. Storage (bingo-games)

Put the list in `bingo_game_settings` under the key `holidays`, as a JSON array:

```json
[{"d":"2026-11-26","label":"Thanksgiving"},{"d":"2026-11-27","label":"Black Friday"},
 {"d":"2026-12-25","label":"Christmas Day"},{"d":"2027-01-01","label":"New Year's Day"}]
```

- **Public GET config:** add `holidays: [...]` to the response (the portal reads `GAMES_CFG.holidays`; when it's present the admin tab switches from "waiting for backend" to live).
- **Admin action `holidays_set`** (same PIN check as the other `admin` actions): payload `{ holidays:[{d,label}] }`. Validate `d` with `/^\d{4}-\d{2}-\d{2}$/`, trim `label` to 40 characters, de-duplicate by `d`, cap at 60 rows. Return `{ ok:true, holidays }`.

## 2. Shared helper (copy into each edge function, or a shared module)

```ts
const etDate = (t = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isWeekend = (iso: string) => [0, 6].includes(new Date(iso + 'T12:00:00Z').getUTCDay());
async function loadHolidays(db): Promise<Set<string>> { /* read bingo_game_settings.holidays, cache 60 s */ }
const isOffShift = (iso: string, hol: Set<string>) => isWeekend(iso) || hol.has(iso);
const nextWorkShift = (iso: string, hol: Set<string>) => { let d = addDays(iso, 1); while (isOffShift(d, hol)) d = addDays(d, 1); return d; };
// Error every blocked action should return (the portal already shows `error` as a toast):
const HOLIDAY_ERR = (label: string) => ({ ok: false, holiday: true, error: `Holiday pause (${label}). Balik next shift!` });
```

## 3. Where to call it

Wherever the code already skips weekends, add `|| hol.has(etDate)`. Specifically:

| Game | Change |
|---|---|
| **Pet Race** (`bingo-pet-race`) | (a) When building `legTimes`, put the 3 race days (8 hourly legs each) on **working shifts only**. (b) The leg runner: if a leg's time lands on an off shift, don't run it. Move that leg and every later leg to the same hours on `nextWorkShift`, then save the new `legTimes` (the portal timeline and countdowns read `legTimes`, so they update by themselves). (c) Registration closes at the end of the last **working** shift on or before Tuesday. (d) Dice, rest, cheer, boosts, obstacle clears, clashes, evolve: return `HOLIDAY_ERR` on an off shift. |
| **Bayani City** (`bingo-games` action `city`) | `roll` / buy / trade return `HOLIDAY_ERR`. The season end counts working shifts, so a holiday adds one shift at the end (same as Marathon's "Skip & extend"). |
| **Bayani Park + Boss Raid** (`bingo-park`) | Ticket purchase returns `HOLIDAY_ERR`. The raid scheduler skips off shifts. A Friday raid on a holiday is **skipped, not moved**. A manual admin summon stays allowed. |
| **Pet care cron** | Decay and the 8 PM daily token drop skip off shifts (the weekend skip already exists; add the holiday check). |

Not paused: BINGO (admin-run), Spin, Higher/Lower, RPS, Beat Sir Rendy, Shop, Avatar Studio. World Marathon keeps its own holiday list. Optional later: read this shared list there too.

## 4. Test

1. Save the list from Admin → 🎌 Holidays. The GET config returns `holidays`.
2. Fake "now" = 2026-11-26 22:00 PHT. City roll, Park ticket and Race dice return the holiday error. Pet decay and the daily drop don't run.
3. A race whose Day 2 was set for Thu Nov 26 now shows Day 2 on Mon Nov 30 and Day 3 on Tue Dec 1.
