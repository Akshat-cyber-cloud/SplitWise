# DECISIONS.md — SharedSplit Decision Log

Every significant technical or product decision made during the build. For each entry: the decision, the options considered, and the reasoning.

---

## D1: Currency Conversion Strategy

**Decision**: Convert foreign currency amounts to INR at the **historical exchange rate on the expense date**. Store both `amount` (original) and `amount_in_inr` (converted). Never discard the original.

**Options Considered**:
| Option | Pros | Cons |
|---|---|---|
| A — Fixed rate (1 USD = ₹83 always) | Simple | Inaccurate; rate changes daily |
| B — Live rate at import time | Simple API call | Rate from 3 months ago ≠ rate today; creates inconsistency |
| **C — Historical rate on expense date** | Accurate, auditable | Requires external API, adds latency |

**Chose C** because accuracy matters when expenses span months. A dollar trip expense from February should use February's rate, not today's.

**Rate source**: `exchangerate.host` historical endpoint (free, no API key needed for historical data).

**Fallback**: If the API fails for a date, the import logs the error in `normalizations` and falls back to a hardcoded rate of 83 INR/USD. The original amount is always preserved for re-processing.

---

## D2: Fractional Paisa Rounding

**Decision**: Round **down** each share to 2 decimal places. The fractional remainder goes to the **first person in the split list** (the payer by convention).

**Options Considered**:
| Option | Description |
|---|---|
| A — Largest Remainder Method | Fair, used in proportional representation; complex to explain |
| **B — Round down, give remainder to payer** | Simple, deterministic, always rounds in payer's favour |
| C — Round to nearest paisa | Slightly fairer, but sum may not equal total |

**Chose B**: Simple to explain, easy to audit, deterministic (same input always gives same output). The payer already fronted the money, so giving them the fractional paisa is reasonable.

**To change**: Modify the index check in `split.service.js:computeSplits`.

---

## D3: Negative Amount Handling

**Decision**: Route **all** negative amounts to the anomaly queue for human review. Never auto-import or auto-reject.

**Logic applied on review**:
- If a matching positive expense exists (same description, similar magnitude) → likely a correction/refund → **Approve** (stored as a negative expense, reduces group total).
- If isolated with no context → likely a data entry error → **Reject**.

**Why not auto-approve refunds?** A negative entry that is approved affects everyone's balance. Auto-approval without human confirmation is risky.

---

## D4: Duplicate Detection

**Matching rule**: Same `date` + `amount` + `description` (case-insensitive, whitespace-trimmed) within the **same import batch**.

**Options Considered**:
| Option | Description |
|---|---|
| A — Exact match on all three fields | Low false positive rate; misses typo variants |
| **B — Fuzzy description match** | Better recall; high false positive risk |
| C — Match on date + amount only | Too loose; different expenses can share both |

**Chose A** (exact match): Safer for an MVP. A false positive (flagging a valid expense as duplicate) is recoverable by approving in the anomaly queue. A false negative (missing a real duplicate) causes silent data corruption, which is worse.

**Action**: Always route to anomaly queue — never auto-delete either copy.

---

## D5: Settlement vs Expense

**Detection**: Description contains any keyword from: `paid back`, `settle`, `repay`, `reimburs`, `transfer`, `returned` (case-insensitive substring match).

**Options Considered**:
| Option | Description |
|---|---|
| A — Regex on keywords | Good coverage; a few false positives possible |
| B — Separate UI field for entry type | Better UX; requires user discipline at entry time |
| C — Amount sign (negative = settlement) | Assumes settlements are entered as negatives; not reliable |

**Chose A**: The keyword approach catches the most common cases from real spreadsheet data. False positives go to the anomaly queue (human confirms). A settlement that is approved is written to the `payments` table — it does **not** appear in expenses or affect group spend totals.

---

## D6: Membership Date Windows

**Decision**: A member's balance is only affected by expenses whose `date` falls within `[joined_at, left_at)`.

**Implication**:
- Meera (`left_at = 2024-03-31`): expenses on April 1+ don't touch her balance.
- Sam (`joined_at = 2024-04-15`): expenses before April 15 don't touch his balance.

**Query**: See `balance.controller.js:_calcBalance` — the `dateFilter` object enforces this window via Prisma `where` clause.

**Edge case**: A `left_at` of `NULL` means the member is still active (no upper bound on expenses).

---

## D7: ORM Choice (Prisma vs Raw SQL)

**Decision**: Use **Prisma** for all database access.

**Options Considered**:
| Option | Pros | Cons |
|---|---|---|
| Raw SQL | Maximum performance and flexibility | Verbose; SQL injection risk if not parameterised carefully |
| **Prisma** | Type-safe, readable, easier to explain; handles migrations | Slightly more abstraction; slightly slower for complex aggregations |
| Sequelize | Mature ecosystem | Less ergonomic than Prisma for TypeScript/JS |

**Chose Prisma**: The dataset size (a few hundred rows) makes raw SQL performance gains irrelevant. Prisma's explicit models and migration system make the schema self-documenting.

**One exception**: Sequence reset in `seed.js` uses a `$executeRawUnsafe` call because Prisma has no built-in sequence control. See Case 1 in `AI_USAGE.md`.

---

## D8: Guest Users (Kabir from the Goa Trip)

**Decision**: Option B — **exclude "Dev's friend Kabir"** from splits entirely and redistribute his share equally among the registered members in `split_with`.

**Options Considered**:
| Option | Description |
|---|---|
| A — Create a Kabir user account | Kabir gets full UI access; clutters member list permanently |
| **B — Redistribute his share** | No data model changes; keeps group membership clean |
| C — Absorb his share into Dev's portion | Shifts liability incorrectly |

**Chose B**: Kabir is a one-time guest. Adding him as a permanent member would require handling his balance, settlement, and eventual removal. Redistributing his share is transparent (shown as a normalization note in the import report) and keeps the data model correct.

---

## D9: No Automated Unit Tests in MVP

**Decision**: Ship without a unit test suite.

**Reasoning**: Time constraint (48-hour assignment). The balance calculation and anomaly detection logic were instead verified by:
1. Manual walkthrough with the provided CSV data.
2. Seeded data checks against expected outcomes.
3. The anomaly queue itself — every flagged row was reviewed in the UI.

**If time allowed**: Unit tests for `split.service.js:computeSplits`, `detectors.js:runDetectors`, and `balance.controller.js:_calcBalance` would be the first three to write.

---

## D10: JWT in LocalStorage vs HttpOnly Cookie

**Decision**: Store JWT in **localStorage**.

**Options Considered**:
| Option | Pros | Cons |
|---|---|---|
| HttpOnly cookie | XSS-safe; automatic CSRF protection | Requires cookie config, CORS setup for same-site |
| **localStorage** | Simple; easy to implement in React | Vulnerable to XSS (acceptable for a demo app without sensitive financial data) |

**Chose localStorage** for simplicity in a demo/assignment context. A production deployment would migrate to HttpOnly cookies with a CSRF token.

---

## D11: Balance Algorithm (Greedy Simplification vs Exact Minimum Transactions)

**Decision**: Calculate net balances per person (who owes the group, who is owed), then display direct settlement suggestions using a **greedy two-pointer** approach.

**Options Considered**:
| Option | Description |
|---|---|
| A — Show raw pairwise debts | Simple; may generate many redundant payment links |
| **B — Greedy net balance + simplification** | Minimises number of transactions; easy to explain |
| C — Linear programming (optimal minimum) | True minimum; complex to implement |

**Chose B**: The greedy net-balance approach is simple, fast, and reduces the number of required payments significantly compared to raw pairwise debts. For five people it produces the optimal or near-optimal result. The drill-down panel (Rohan's request) shows exactly which expenses contribute to each person's net.
