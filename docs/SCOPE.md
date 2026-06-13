# SCOPE.md – SharedSplit

## Schema Overview

| Table | Purpose |
|---|---|
| `users` | Authentication & identity |
| `groups` | A named group of people sharing expenses |
| `group_memberships` | Tracks WHEN a user is a member (joined_at / left_at) |
| `expenses` | Single expense: who paid, how much, what currency |
| `expense_splits` | Per-person share for every expense (final INR amount) |
| `payments` | Settlements between two members |
| `import_batches` | Metadata for each CSV upload |
| `import_anomalies` | Rows flagged by detectors, with status: pending/approved/rejected |

## Anomaly Detectors

| Detector | Trigger | Default action |
|---|---|---|
| `missing_fields` | date/description/amount/paid_by blank | Reject |
| `bad_date_format` | Unparseable date string | Reject |
| `zero_amount` | amount == 0 | Reject |
| `negative_amount` | amount < 0 | Flag for review |
| `unsupported_currency` | Currency not in allowed list | Flag for review |
| `settlement_as_expense` | Description contains repay/settle/transfer keywords | Reclassify |
| `duplicate` | Same date + amount + description in same batch | Flag for review |

## Supported Split Types

| Type | Input | Normalization |
|---|---|---|
| EQUAL | userIds[] | Total ÷ N, remainder to payer |
| EXACT | { userId, amount }[] | Validates sum = total |
| PERCENTAGE | { userId, percentage }[] | Validates sum = 100 |
| SHARES | { userId, shares }[] | Ratio-based, validated |

All types are normalised to `expense_splits.share_amount` in INR.
