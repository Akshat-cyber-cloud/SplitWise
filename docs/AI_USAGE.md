# AI_USAGE.md – SharedSplit

## AI Tools Used
- Antigravity IDE (Google DeepMind) — scaffolding, route stubs, Prisma schema

---

## Prompts Used

1. *"Create the full folder structure for a Node.js + Express + Prisma + React app for shared expense tracking, including all route/controller/service stubs"*
2. *"Write the balance calculation logic that respects membership join/leave dates"*
3. *"Write anomaly detectors for CSV import: duplicate, negative amount, currency, settlement-as-expense, bad date"*

---

## Cases Where AI Got It Wrong (fill in during Day 2)

### Case 1: [to fill]
**What AI generated**: …
**What was wrong**: …
**How I fixed it**: …

### Case 2: [to fill]
**What AI generated**: …
**What was wrong**: …
**How I fixed it**: …

### Case 3: [to fill]
**What AI generated**: …
**What was wrong**: …
**How I fixed it**: …

---

## Notes
- Every AI-generated diff was read before accepting.
- The core balance query (`balance.controller.js:_calcBalance`) was reviewed line-by-line to confirm the membership window filter is correct.
- Watch for: AI ignoring `leftAt` filter, AI mishandling Decimal types from Prisma (they come back as strings, not numbers — always wrap in `Number()`).
