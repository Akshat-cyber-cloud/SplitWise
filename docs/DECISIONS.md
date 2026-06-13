# DECISIONS.md – SharedSplit

## D1: Currency Conversion

**Decision**: Convert to INR at the exchange rate on the expense date.
Store both `amount` (original) and `amount_in_inr` (converted). Never discard the original.

**Why**: The original amount is auditable. If we ever change the rate source, we can re-run the conversion without data loss.

**Rate source**: exchangerate.host historical API (free, no key needed for historical rates).

---

## D2: Rounding Rule

**Decision**: Round down each share to the nearest paisa (2 decimal places). The fractional remainder goes to the **first person in the split list** (which is the payer by convention in the UI).

**Why**: Simple, deterministic, easy to explain. Alternative was Largest Remainder Method (more fair but harder to explain in a 45-min session).

**Change live**: To change the remainder recipient, modify the index check in `split.service.js:computeSplits`.

---

## D3: Negative Amounts

**Decision**: Route ALL negative amounts to the anomaly queue.

**Reasoning**:
- If a matching positive expense exists (same description, same magnitude) → likely a correction/refund → Approve as negative entry.
- If isolated → likely a data entry error → Reject.
- We never auto-delete or auto-correct. The human (Meera) decides.

---

## D4: Duplicates

**Matching rule**: Same `date` + `amount` + `description` (case-insensitive, trimmed) within the **same import batch**.

**Why not fuzzy match?** Fuzzy matching risks false positives. Exact match is safer for an MVP. We can add fuzzy later.

**Action**: Always route to anomaly queue — never auto-delete.

---

## D5: Settlement Logged as Expense

**Detection**: Description contains any of: "paid back", "settle", "repay", "reimburs", "transfer", "returned".

**Action on approve**: The row is written to the `payments` table (not `expenses`). This keeps the balance calculation clean.

---

## D6: Membership Timing

**Decision**: A member's balance is only affected by expenses whose `date` falls within `[joined_at, left_at)`.

**Implication**: If Sam leaves on Jan 20 and an expense is dated Jan 21, Sam owes nothing for it.

**Query**: See `balance.controller.js:_calcBalance` — the `dateFilter` object implements this.

---

## D7: ORM Choice (Prisma vs raw SQL)

**Decision**: Prisma for schema management and CRUD; the balance query is intentionally written as explicit Prisma calls (not a single mega raw-SQL query) so every step is readable and defensible.

**Tradeoff**: A raw SQL GROUP BY would be faster at scale, but Prisma is easier to explain line-by-line in a 45-min session.
