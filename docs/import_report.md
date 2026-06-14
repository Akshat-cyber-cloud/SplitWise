# SplitWise Smart Import System

This document explains the conceptual workings of the CSV Import Pipeline. It details how raw, messy spreadsheet data is automatically parsed, normalized, and converted into accurate ledger entries.

## 1. The Import Pipeline Overview

When a user uploads a CSV file (e.g., `expenses_export.csv`), the system processes the data in three phases:
1. **Normalization & Auto-Handling:** Cleans up names, currencies, and membership dates.
2. **Smart Split Calculation:** Parses natural language instructions to figure out exact math.
3. **Anomaly Detection:** Flags suspicious rows (duplicates, settlements, negative amounts) for human review before committing them to the database.

---

## 2. Natural Language Split Parsing

The spreadsheet often contains informal notes in the `split_details` column instead of strict mathematical formulas. The system uses a **Smart Parser** to extract the exact splits based on the `split_type`.

### `UNEQUAL` / `EXACT` Splits
- **Example:** `"Rohan 700; Aisha not charged obviously"`
- **How it works:** The parser scans the text for names paired with numbers. It finds `"Rohan"` and `"700"` and locks his exact share to ₹700 (converting foreign currency automatically if needed). Because there is no number next to Aisha, she is ignored. The remaining balance of the bill is then split **equally** among the remaining active group members.

### `PERCENTAGE` Splits
- **Example:** `"Aisha 30%; I percentages might be off"`
- **How it works:** The parser assigns 30% of the total bill to Aisha. The remaining 70% is divided equally among the other active members in the `split_with` column.

### `SHARES` Splits
- **Example:** `"Aisha 1; Rohan and Dev took the bigger ones"`
- **How it works:** Aisha is assigned exactly 1 share. Anyone else involved in the expense who does not have a specific number written next to their name defaults to 1 share as well. The math is calculated dynamically based on the total shares.

---

## 3. Data Normalization (Auto-Handled)

The system automatically cleans up messy data without requiring manual user intervention. These actions are logged as `AUTO_HANDLED` events.

### Name Deduplication & Aliases
- Users often type names differently (e.g., `Priya`, `Priya S`, `priya`). The system maps these aliases to a single, normalized `User` profile to ensure balances remain strictly tied to the correct person.

### Date-Based Membership Windows
- **Scenario:** Meera moved out at the end of March, but the spreadsheet included her in April's rent.
- **How it works:** The system tracks `joinedAt` and `leftAt` dates for all users. During import, if an expense is dated in April, the system automatically excludes Meera from the split calculation, even if she is listed in the `split_with` column.

### Foreign Currency Conversion
- **Scenario:** A Goa trip expense is logged as `45 USD`.
- **How it works:** The system detects the `USD` flag, calls a historical exchange rate API for the exact date of the expense, and calculates the exact `amount_in_inr`. The original USD amount is permanently preserved in the database for reference.

### Notes Extraction
- Any conversational text found in the `notes` column of the CSV is automatically appended in brackets to the end of the `description` so valuable context isn't lost (e.g., `Dinner (Dev visiting for the weekend)`).

---

## 4. Anomaly Detectors

Not all rows can be safely imported. The system runs 8 distinct anomaly detectors on every row. Suspicious rows are placed in a `PENDING` state and require manual review via the UI.

1. **Missing Fields:** Rejects rows missing critical data (date, amount, paid by).
2. **Invalid Amount:** Rejects non-numeric amounts (e.g., `"N/A"`).
3. **Zero Amount:** Rejects rows with `0` amount, as they have no financial effect.
4. **Unsupported Currency:** Flags currencies not explicitly supported by the exchange API.
5. **Negative Amounts:** Flags negative numbers (e.g., `-30 USD`). These are often refunds for cancelled bookings and must be manually verified before they are allowed to reduce the group's total expenditure.
6. **Settlements vs. Expenses:** Flags rows where the description contains words like `"paid back"`, `"repay"`, or `"returned"`. These are peer-to-peer debts, not group expenses. If approved, the system converts the row into a `Payment` record rather than an `Expense`.
7. **Duplicates:** Flags rows that have the exact same date, amount, and description as another row in the same batch, preventing accidental copy-paste double charging.
