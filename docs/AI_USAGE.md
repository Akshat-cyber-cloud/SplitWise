# AI_USAGE.md — SharedSplit

---

## AI Tools Used

| Tool | Version / Model | Purpose |
|---|---|---|
| **Antigravity IDE** (Google DeepMind) | Gemini 2.5 Flash (Medium) | Primary development assistant — scaffolding, route stubs, Prisma schema, UI components, documentation |

---

## Key Prompts Used

The following were the major prompts that drove significant chunks of code or architecture:

### 1. Initial Scaffold
> *"Create the full folder structure for a Node.js + Express + Prisma + React (Vite) app for shared expense tracking. Include all route/controller/service stubs with placeholder comments. The schema should support: users, groups, group memberships with join/leave dates, expenses with split types (EQUAL/EXACT/PERCENTAGE/SHARES), settlements (payments), CSV import batches, and import anomalies."*

**What it produced**: The full directory tree, `schema.prisma` with all 8 tables, route files, controller stubs, and `server.js`. Required adjustments: the initial schema lacked the `import_anomalies.resolved_at` field and the `expense_splits.share_amount` precision annotation — both were added manually.

---

### 2. Membership-Windowed Balance Calculation
> *"Write the balance calculation logic in balance.controller.js. Each user's balance should only be affected by expenses whose date falls within their group_memberships.joined_at and left_at window. Return: total paid by each member, total owed by each member, and a net balance. Use Prisma."*

**What it produced**: The `_calcBalance` private function with Prisma `where` clause date filtering. Required adjustment: the initial draft did not handle `left_at = null` (still-active members) correctly — the condition was `date < left_at` which threw for null values. Fixed by adding `left_at ? { lt: left_at } : undefined` conditional.

---

### 3. CSV Anomaly Detectors
> *"Write anomaly detectors for CSV import in a detectors.js service. Detectors needed: duplicate rows (same date+amount+description), negative amount, zero amount, bad date format, unsupported currency, settlement disguised as expense (keyword match), and missing required fields. Each detector should return { detector, suggestedAction } or null."*

**What it produced**: All 8 detectors in the correct pattern. Required adjustment: `detectDuplicate` was comparing `r.amount === row.amount` as strings, but `parseAmount` had already converted them to numbers earlier in the pipeline — causing the comparison to always fail. Fixed by comparing the raw string values before parsing in the duplicate detector.

---

### 4. Landing Page (Neo-Brutalist Design)
> *"Create a beautiful neo-brutalist landing page for our SharedSplit app in React with Tailwind. Replace credit card imagery with relatable group expense receipt cards. Use: mesh gradient blobs (amber/blue/pink), black borders, flat box shadows, floating emoji category coins (✈️ 🏠 ☕), receipt-style card UI showing a dinner split, and a balance card. Match this mockup style: [description of design]."*

**What it produced**: The complete `LandingPage.jsx` with all animations, cards, and layout. Required adjustment: the initial card absolute positioning caused overflow on small screens — added `lg:overflow-hidden` on the container and reduced card dimensions for mobile breakpoints.

---

### 5. Group Expense Detail + Add Expense Modal
> *"Write GroupDetail.jsx page. It should: fetch group info and expenses, show member list with join/leave dates, provide a modal to add an expense with split type selector (EQUAL/EXACT/PERCENTAGE/SHARES), show expense list with amount in INR, and allow marking a member as left the group."*

**What it produced**: A 600+ line component covering most of the requirements. Required adjustment: the split input section didn't dynamically render member rows when the split type changed — `useEffect` dependency was missing `splitType`, causing stale member input arrays. Fixed by adding `splitType` to the effect dependencies.

---

## Three Concrete Cases Where AI Got It Wrong

### Case 1: Database Sequence Not Reset After Seed

**What AI generated**: The `seed.js` file upserted a group with hardcoded `id: 1`, but did not reset PostgreSQL's auto-increment sequence.

**What was wrong**: After seeding, the `groups_id_seq` was still at 1. Creating any new group from the UI caused `Unique constraint failed on the fields: ('id')` because the next auto-generated ID collided with the seed record.

**How I caught it**: Clicked "Create Group" in the UI — immediate 500 error in the console. Checked the PostgreSQL logs and saw the unique constraint violation on `id = 1`.

**What I changed**: Appended to `seed.js`:
```js
await prisma.$executeRawUnsafe(
  "SELECT setval('groups_id_seq', COALESCE((SELECT MAX(id) FROM groups), 1));"
);
```
This syncs the sequence pointer with the actual maximum `id` after seeding.

---

### Case 2: Sign Inversion in Net Balance Formula

**What AI generated**: In `balance.controller.js`:
```js
const netBalance = totalPaid - totalOwed - totalSent + totalReceived;
```

**What was wrong**: When Rohan paid Alice ₹500 as a settlement, `totalSent` was **subtracted** from Rohan's balance — making him appear to owe *more* money. `totalReceived` was added to Alice's balance — making her appear to be *more* owed. This doubled the debt instead of settling it.

**How I caught it**: Entered a test settlement in the UI, then checked the balance page. Rohan's debt increased by ₹500 instead of decreasing.

**What I changed**: Corrected the formula to:
```js
const netBalance = totalPaid - totalOwed + totalSent - totalReceived;
```
`totalSent` is money leaving the user's "owe" column (reduces what others owe them), `totalReceived` increases what the user received as settlement (reduces their own debt).

---

### Case 3: `const` Hoisting Error on Mount in BalancePage

**What AI generated**: In `BalancePage.jsx`, the `viewDetail` function was declared with `const` below the `fetchBalances` function, but `fetchBalances` called `viewDetail` on mount if a `?userId=X` query param was present:

```js
const fetchBalances = async () => {
  // ...
  if (userId) viewDetail(userId); // called before viewDetail is declared!
};

const viewDetail = (id) => { ... }; // declared after
```

**What was wrong**: `const` variables are not hoisted in JavaScript (unlike `function` declarations). On mount, `viewDetail` was `undefined` when `fetchBalances` ran, throwing `TypeError: viewDetail is not a function` and leaving the ledger panel blank.

**How I caught it**: Opened the Balance page with a `?userId=2` URL — the panel stayed blank and the browser console showed the TypeError.

**What I changed**: Moved the `viewDetail` declaration **above** `fetchBalances`. Also added a guard to prevent calling `setSearchParams` recursively when the `userId` in the URL was already the same value being set.

---

## Notes on AI Workflow

- Every AI-generated diff was **read before accepting**. No blind copy-paste.
- The core balance calculation (`balance.controller.js:_calcBalance`) was reviewed line-by-line to confirm the membership window filter is correct.
- **Known AI blind spots encountered**:
  - AI tends to forget about `null` handling for optional Prisma fields (like `left_at`).
  - AI-generated Prisma queries often return `Decimal` types as strings — always wrap in `Number()` before arithmetic.
  - AI-generated React effects frequently have incomplete dependency arrays — always verify with ESLint `react-hooks/exhaustive-deps`.
