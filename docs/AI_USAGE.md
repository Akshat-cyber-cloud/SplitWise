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

### Case 1: Database Seed Unique Constraint Error on Group ID
**What AI generated**: Upserted Alice and Bob, then upserted Goa Trip 2024 with a hardcoded ID `1` in the database seed file (`seed.js`), but did not reset or advance the PostgreSQL autoincrement sequence generator.
**What was wrong**: Subsequent group creations in `group.controller.js` failed with `Unique constraint failed on the fields: ('id')` because PostgreSQL's `groups_id_seq` remained at 1, causing the next auto-generated group ID to collide with the hardcoded seed ID.
**How I fixed it**: Appended a raw SQL query execution to `backend/prisma/seed.js` after database inserts: `await prisma.$executeRawUnsafe("SELECT setval('groups_id_seq', COALESCE((SELECT MAX(id) FROM groups), 1));");` to sync the sequence pointer with the actual maximum group ID.

### Case 2: Sign Inversion in Net Balance Settlement Calculations
**What AI generated**: In `balance.controller.js`, the net balance formula was generated as: `const netBalance = totalPaid - totalOwed - totalSent + totalReceived;`.
**What was wrong**: A payment sent by a user (`totalSent`) was being subtracted from their net balance (making them appear to owe *more*), while a payment received (`totalReceived`) was being added. This caused Bob paying Alice ₹500 to double their debts in the ledger instead of settling them.
**How I fixed it**: Corrected the formula signs to reflect the actual ledger mathematics: `const netBalance = totalPaid - totalOwed + totalSent - totalReceived;`.

### Case 3: Ledger Pre-selection Hoisting Error on Mount
**What AI generated**: In `BalancePage.jsx`, the asynchronous `viewDetail` function was called inside `fetchBalances` on mount if a `?userId=X` query parameter was present, but `viewDetail` was declared with `const` below the `fetchBalances` declaration.
**What was wrong**: Since variables declared with `const` are not hoisted in JavaScript, calling `viewDetail` during the mount phase threw a runtime `TypeError: viewDetail is not a function` error, causing the ledger detailed pane to display the default blank state.
**How I fixed it**: Moved the `viewDetail` declaration above the `fetchBalances` method, and added check logic so `setSearchParams` is only invoked if the new `userId` is different from the current URL parameter, preventing recursion rendering loops.

---

## Notes
- Every AI-generated diff was read before accepting.
- The core balance query (`balance.controller.js:_calcBalance`) was reviewed line-by-line to confirm the membership window filter is correct.
- Watch for: AI ignoring `leftAt` filter, AI mishandling Decimal types from Prisma (they come back as strings, not numbers — always wrap in `Number()`).
