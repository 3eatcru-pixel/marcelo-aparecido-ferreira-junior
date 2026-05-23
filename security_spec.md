# AUDTRILHA Security Specification

## Data Invariants

1. **Identity Integrity**: The `uid` in a document (e.g., `authorId`, `userId`, `ownerId`) must strictly match `request.auth.uid`.
2. **RBAC Isolation**: Users cannot modify their own `role`, `coins`, or `promoCoins`. These are system-controlled.
3. **Relational Sync**: A `Chapter` cannot exist without a parent `Work`. Access to a `Chapter` is governed by the `Work`'s status (published vs draft) and authorship.
4. **Economic Purity**: `wallets`, `transactions`, and `entitlements` are write-restricted to the system-level (`isAdmin`). Users can only `read` their own records.
5. **Uniqueness Registry**: The `usernames` collection acts as a unique index. A user can only create/update a mapping that points to their own `uid`.
6. **Terminal State Locking**: Once a `Payout` is marked as `PAID` or `REJECTED`, it becomes immutable for non-admins.
7. **Immutable Timestamps**: `createdAt` must be set via `request.time` and never changed. `updatedAt` must be updated on every write.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

| ID | Title | Target Path | Payload | Expected |
|----|-------|-------------|---------|----------|
| 1 | Self-Promotion | /users/{uid} | `{ "role": "ADMIN" }` | DENIED |
| 2 | Free Money | /users/{uid} | `{ "coins": 999999 }` | DENIED |
| 3 | Work Spoofing | /works/{id} | `{ "authorId": "attacker_uid", "title": "Stolen" }` | DENIED |
| 4 | Orphaned Chapter | /works/valid_work/chapters/{id} | `{ "workId": "wrong_work_id", ... }` | DENIED |
| 5 | Ghost Field Update | /works/{id} | `{ "isVerified": true, "title": "New" }` | DENIED |
| 6 | Username Stealing | /usernames/taken_name | `{ "uid": "attacker_uid" }` | DENIED |
| 7 | PII Leak | /users/other_user | `get()` | DENIED (unless admin) |
| 8 | Blanket Listing | /users | `list()` | DENIED |
| 9 | State Shortcut | /payouts/{id} | `{ "status": "PAID" }` | DENIED |
| 10 | Immutable Bypass | /works/{id} | `{ "createdAt": 12345 }` (Update) | DENIED |
| 11 | Cross-Draft Editing | /projects/other_project | `write()` | DENIED |
| 12 | Wallet Injection | /wallets/attacker_uid | `{ "balance": 1000 }` | DENIED |

## Proposed Security Rules Structure

The rules will use the **Master Gate** pattern with `isValid[Entity]` helpers and `affectedKeys().hasOnly()` gates.

### Helpers
- `isSignedIn()`: Basic auth check.
- `isEmailVerified()`: Check if `request.auth.token.email_verified`.
- `isOwner(id)`: Check if `request.auth.uid == id`.
- `isAdmin()`: Check if user has `ADMIN` role in `users` collection or is in the admin email list.
- `isValidId(id)`: Regex and size check for document IDs.

### Validation Blueprints
- `isValidUser(data)`
- `isValidWork(data)`
- `isValidChapter(data)`
- `isValidPost(data)`
- `isValidComment(data)`
- `isValidPayout(data)`
