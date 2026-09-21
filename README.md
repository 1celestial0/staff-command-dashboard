# Staff Command Dashboard

Live, auto-refreshing staff ops board for **Sourav Dutta**.

## Live data

1. **Google Sheets (preferred source of truth)**
   - StaffNow: https://docs.google.com/spreadsheets/d/1FCmS05SFPVDoz0aT8FO-mxlC06AJU13MYP5gzxzGhfA/edit
   - Events: https://docs.google.com/spreadsheets/d/11kTJlbF5wbvp_MnSAPMPUqz0UfuFanb--EIoacxOayM/edit
2. **Fallback:** `public/status.json` (polled every 4s via `/api/staff`)

### Make Sheets feed the live app

1. Open StaffNow → **Share** → **Anyone with the link** → **Viewer**
2. Optional: set Vercel env `SHEETS_CSV_URL` to the export URL (already defaulted in `api/staff.js`)
3. Keep the dashboard tab open — it polls every 4 seconds

### Chief of Staff update path

Edit a row in **StaffNow** (Status / Now / Target / EffortMins / Outcome / Notes / UpdatedAt).  
Append a row to **Events** for analytics (start|update|done|blocked).

Or update the JSON fallback:

```bash
node scripts/update-status.mjs --id research-scout --status "In Progress" --now "FDE brief draft" --effort 120 --outcome Learning
node scripts/sync-from-sheets.mjs --file seed/StaffNow.csv
```

Then commit + push (or `vercel --prod`) so `status.json` updates on the public URL.

## Local

```bash
npx serve -l 3456 .
# open http://localhost:3456
```

## Schema

**StaffNow:** Staff, Lane, Priority, Status, Now, Target, StartedAt, UpdatedAt, EffortMins, Outcome, Notes  
**Events:** Timestamp, Staff, EventType, FromStatus, ToStatus, EffortMinsDelta, Outcome, Note  
**Outcome:** Value | Waste | Learning | Blocked
