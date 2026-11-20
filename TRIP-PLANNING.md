# Trip calendar

`/calendar` edits trip dates, visits, reservations and weekly open hours. The drawer owns which stops are in the trip and their order; the calendar owns time.

## Rules

- One visit per stop, inside a single trip day, in 30-minute steps. Times are destination-local (UTC is only a neutral clock).
- Scheduled stops are always listed in time order (the backend checks this on save).
- Placing, moving or resizing a visit re-sorts the list. Overlaps and closed hours are rejected.
- **Reorder (drag or Move up/down):** unscheduled stops go anywhere. A scheduled stop keeps its clock time and may switch to a neighbour's day to stay in order. If no day fits, the move is rejected — it's never pushed, shortened or unscheduled.
- **Move to day** (drawer menu): same time on another trip day, if that slot is free.
- **Reserved** visits can't be moved until unreserved.
- **Duplicate stop** adds an unscheduled copy after its source; Calendar Save creates it.

## Saving

- A reorder that doesn't touch times is a drawer change (drawer Save).
- Anything that changes a visit — or any move while the calendar has unsaved edits — goes into the calendar draft. Save it from Calendar.
- Calendar Save first saves pending drawer changes, then sends `{ version, calendar: { startDate, endDate, visits, availability, newStops, order } }`.
- A draft based on an older trip version must be Reset before saving.

## Commands

```sh
pnpm dev          # http://localhost:8000
pnpm type-check
pnpm build
```
