# World Marathon: Fair Race v2 (backend handoff for Viktor)

**Problem:** Skye reached step 100 (the old cap) on shift 8 of 25. Steps can't go past 100, so the leaders will all pile up at 100 with no way to separate them. Root cause: the course was sized for about 4 steps/shift, but stacking (Hard +4, Energy gel +3, pet pacer +2, extra race, shortcuts, Kahon, streak) gives 9–18 steps/shift.

**Goal:** one winner, a race that stays open until the last shift. **The front-end is ready (`bayani-marathon.js`).** It does nothing new until the server sends `race` in the `state` response, so nothing changes for players until you deploy. Keep the change as small as possible.

## 0. Settings (already saved by Admin → Fair race)

The admin save already sends `settings.race`. Defaults if it's missing:

```json
{"finish":240,"shiftCap":10,"oneBoost":true,"slipGap":15,"slipBonus":1,"crown":1,
 "sprintShifts":5,"sprintUp":6,"sprintDown":-3,"sprintCap":12}
```

## 1. Course length: use `pos` for anything about the course

Steps stay real numbers, and nobody's step changes. Wherever the server uses a step for course geometry, use `pos = step * 100 / finish` instead (this gives the same 0–100 scale as today):

- leg for gear (`swim/bike/run`), country, transfers/hops, Train +1 bonus
- safe floors: `[75,50,25,0]` in pos, which is steps **180 / 120 / 60 / 0** at finish 240
- fog: hide other racers' `step` (send `null`) when `pos >= 90`, which is step **216+** (admin still sees everything)
- the cap: replace every `Math.min(100, …)` with `Math.min(finish, …)`
- mystery steps: keep the existing ones and generate new ones for steps `101 … finish-1` at the same density (`mystDensity`). The front-end draws them at their scaled position.

## 2. Finish line = one winner

- When a racer's step reaches `finish` for the first time, set `finishedAt = now` and post to Slack: `🏁 {name} crossed the finish line in Athens!`
- A finished racer can't `start`, `extra`, `gear`, `pacer` or `kahon`. Return `{ ok:false, error:"🏁 You've finished! Wait for the Finish Line Reveal." }`.
- **Ranking (used for the leader, Slack recaps and `declare`):** step desc, then `finishedAt || reachedAt` asc (reached first wins). Winner = first in that order who meets the eligibility %.
- Store **`reachedAt`** (timestamp) every time a racer's step changes.

## 3. Balance rules (in the `answer` / `timeout` / `kahon` handlers)

1. **One boost per race** (`oneBoost`): if gear is active, reject `pacer`, and if a pacer is active, reject `gear`. Error: `"One boost per race: your {name} is still active."`
2. **Per-shift cap**: track `gainedToday` per racer per ET shift date. Every positive change (answer, gear, pacer, streak, Kahon free step, shortcut, Train, slipstream) is clamped: `add = Math.min(delta, cap - gainedToday)`, where `cap = sprint ? sprintCap : shiftCap`. Losses are never clamped. When the cap is hit, add a summary line: `🧱 Shift cap reached (+{cap})`.
3. **Slipstream**: on a correct answer, if `leaderStep - myStep >= slipGap`, add `+slipBonus` (this counts toward the cap). Summary line: `💨 Slipstream +1`.
4. **Crown pressure**: on a wrong answer or timeout, if this racer is #1 by the ranking above, take away `crown` more steps (still respecting the safe floor). Summary line: `👑 Crown pressure -1`.
5. **Athens Sprint**: `sprint = season.shift > length - sprintShifts`. During the sprint, Hard uses `sprintUp` / `sprintDown`, and the cap is `sprintCap`. Post once to Slack when it starts: `⚡ Athens Sprint! Hard is now +6/-3 for the last 5 shifts.`

## 4. Response shape (`state` and every player action)

Add one top-level object. **Its presence is what switches the front-end on:**

```js
race: { ...settings.race, sprint: true|false,
        gap: leaderStep - myStep,                    // true steps, even if the leader is fogged; 0 if you lead
        slip: (leaderStep - myStep) >= slipGap }
```

Each item in `racers[]` also gets `reachedAt` and `finishedAt` (or `0`). The same goes for the admin `state`.

## 5. Test

1. Without `race` in the response the portal looks exactly as it does today (already checked).
2. Set Skye to 100 and Gilda to 76 with finish 240. Skye is drawn in France (pos 41.7), Gilda sees `24 behind 👑 · 💨 Slipstream`, and a correct Hard gives Gilda +5.
3. Activate gel, then try a pacer: the pacer is rejected.
4. Answer twice in one shift with gel: the total gain stops at +10.
5. Put two racers on the same step: the one with the earlier `reachedAt` ranks higher, and `declare` picks them.
6. Push a racer to 240: `finishedAt` is set, further actions are blocked, and Slack gets the message.

## Pace check (17 shifts left after Thanksgiving/Black Friday)

At max pace, the leader at 100 can reach at most 100 + 12×10 + 5×12 = **280**. A realistic top pace of about 8/shift gives about **236**. So the finish line at 240 will most likely be decided in the last few shifts, and someone can only cross early by answering perfectly at the cap every shift.
