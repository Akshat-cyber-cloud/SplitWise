# SCOPE.md — SharedSplit Anomaly Log & Database Schema

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `users` | Authentication & identity. Fields: `id`, `name`, `email`, `password_hash`, `created_at` |
| `groups` | A named group of people sharing expenses. Fields: `id`, `name`, `description`, `created_by`, `created_at` |
| `group_memberships` | Tracks **when** a user is a member. Fields: `id`, `user_id`, `group_id`, `joined_at`, `left_at` (nullable = still active) |
| `expenses` | A single expense entry. Fields: `id`, `group_id`, `paid_by_user_id`, `description`, `amount`, `currency`, `amount_in_inr`, `date`, `split_type`, `created_at` |
| `expense_splits` | Per-person share for every expense (final INR amount). Fields: `id`, `expense_id`, `user_id`, `share_amount` |
| `payments` | Settlements between two members. Fields: `id`, `group_id`, `from_user_id`, `to_user_id`, `amount`, `date`, `note`, `created_at` |
| `import_batches` | Metadata for each CSV upload. Fields: `id`, `group_id`, `uploaded_by`, `filename`, `total_rows`, `committed`, `anomaly_count`, `created_at` |
| `import_anomalies` | Rows flagged by detectors. Fields: `id`, `batch_id`, `row_index`, `row_data` (JSON), `detector_name`, `suggested_action`, `status` (`PENDING` / `APPROVED` / `REJECTED`), `resolved_at` |

### Entity Relationship Summary

```
users ──< group_memberships >── groups
users ──< expenses (paid_by_user_id) ──< expense_splits >── users
users ──< payments (from_user_id / to_user_id) >── groups
groups ──< import_batches ──< import_anomalies
```

### Key Design Choices in Schema

- **`group_memberships.left_at`**: `NULL` means still active. The balance query filters with `date >= joined_at AND (left_at IS NULL OR date < left_at)` to window each member's liability.
- **`expenses.amount_in_inr`**: Both original `amount`/`currency` and the INR-converted value are stored. Original is never discarded (see D1 in DECISIONS.md).
- **`expense_splits.share_amount`**: Always in INR, always 2 decimal places. The sum across all splits of one expense equals `amount_in_inr`.

---

## Anomaly Detectors

Eight detectors run on every CSV row during import, in priority order:

| # | Detector | Trigger Condition | Default Action |
|---|---|---|---|
| 1 | `missing_fields` | `date`, `description`, `amount`, or `paid_by` is blank | **Auto-reject** — written to anomaly log, not imported |
| 2 | `invalid_amount` | `amount` column is non-numeric (e.g. `"abc"`, `"N/A"`) | **Auto-reject** |
| 3 | `bad_date_format` | Date cannot be parsed as `DD-MM-YYYY` or `YYYY-MM-DD` | **Auto-reject** |
| 4 | `zero_amount` | `amount == 0` | **Auto-reject** — zero-value entries have no financial effect |
| 5 | `negative_amount` | `amount < 0` | **Flag for review** — may be a refund or correction |
| 6 | `unsupported_currency` | Currency not in `[INR, USD, EUR, GBP, SGD, AED]` | **Flag for review** |
| 7 | `settlement_as_expense` | Description contains: `paid back`, `settle`, `repay`, `reimburs`, `transfer`, `returned` | **Flag for reclassification** — approve to write to `payments` table, not `expenses` |
| 8 | `duplicate` | Same `date` + `amount` + `description` (case-insensitive) appears more than once in the same batch | **Flag for review** |

---

## Data Problems Found in `expenses_export.csv`

The following anomalies were identified in the provided CSV export and handled as documented:

### 1. USD Amounts Treated as INR (Priya's issue)
- **Problem**: The Goa trip portion had expenses logged in USD (e.g., `amount: 45, currency: USD`) but the spreadsheet had been summing them as if they were INR, understating those expenses by ~83× (at the ₹83/$ rate at time of expense).
- **Action**: The `currency` column was retained. The import pipeline calls the `currency.service.js` which fetches the **historical exchange rate** for the expense date from `exchangerate.host` and stores the correct `amount_in_inr`. Original amount and currency are preserved.
- **Detector**: `unsupported_currency` fires only for truly unknown currencies; USD is supported and converts automatically.

### 2. Settlement Logged as an Expense
- **Problem**: One row in the CSV had `description: "Rohan paid back Aisha for March rent"` — this is a debt settlement, not a shared expense. If imported as an expense, it would incorrectly increase the group's total expenditure and distort everyone's balance.
- **Action**: The `settlement_as_expense` detector flags it. On approval, the row is written to the `payments` table (not `expenses`). This keeps balance calculations clean.

### 3. Duplicate Entry
- **Problem**: One expense (same date, same amount, same description) appeared twice in the CSV — a copy-paste error in the original spreadsheet.
- **Action**: `duplicate` detector flags both occurrences. The reviewer rejects one copy; the other is imported normally.

### 4. Meera Left Mid-Expense Period
- **Problem**: Meera moved out end of March. The spreadsheet applied April expenses to her balance as if she were still a member.
- **Action**: `group_memberships.left_at = 2024-03-31`. Balance query uses a date window — any expense dated after March 31 does NOT apply to Meera's balance. Her final net is calculated only on February–March expenses.

### 5. Sam Joined Mid-April
- **Problem**: Sam moved in mid-April. The spreadsheet had no concept of join dates and incorrectly included him in all April expenses from April 1.
- **Action**: `group_memberships.joined_at = 2024-04-15` (or whichever date provided). Sam's balance starts from that date only.

### 6. Dev's Guest Kabir (Non-member in Split)
- **Problem**: The CSV had a split involving "Dev's friend Kabir" who is not a registered user or group member.
- **Action**: Decision D8 — Kabir's share is redistributed equally among the actual members present in `split_with`. Kabir is not added as a user. This avoids polluting the member list with a one-time guest.

### 7. Inconsistent Date Formats
- **Problem**: The CSV used multiple date formats: `DD-MM-YYYY`, `YYYY-MM-DD`, and in some rows written as `14 Feb 2024`.
- **Action**: `csv.service.js:parseDate` tries multiple format parsers in sequence. Rows where no format matches are flagged by `bad_date_format` and auto-rejected.

### 8. Negative Amount (Refund)
- **Problem**: One row had `amount: -500` — apparently a refund for a cancelled booking, but entered as a negative expense in the sheet.
- **Action**: `negative_amount` detector flags it for review. If a corresponding positive expense exists, the reviewer approves it (stored as a negative expense, reducing the shared total). If isolated with no context, it is rejected.

---

## Supported Split Types

| Type | Input Required | Normalization Rule |
|---|---|---|
| `EQUAL` | `userIds[]` | Total ÷ N; fractional remainder goes to payer (index 0) |
| `EXACT` | `{ userId, amount }[]` | Validates: sum of amounts = total |
| `PERCENTAGE` | `{ userId, percentage }[]` | Validates: sum of percentages = 100 |
| `SHARES` | `{ userId, shares }[]` | Ratio-based; each share = (userShares / totalShares) × total |

All split types normalise to `expense_splits.share_amount` stored in INR (2 decimal places).
