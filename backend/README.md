# Bryans Arabella Collection: API (Phase 1)

Node.js + Express + MySQL. Implements every endpoint in the functional spec.

## Run it (Windows)
1. Install MySQL and make sure it is running.
2. In this folder: `copy .env.example .env`, then edit `.env` (DB password, merchant mobile money numbers, admin login).
3. `npm install`
4. `npm run db:setup`   (creates the database, tables, admin user, categories. Safe to re-run: it also upgrades an older database that was built from the spec SQL or an earlier Laravel setup)
5. `npm run dev`        (API on http://localhost:4000/api/v1)

## Notes
- Auth is a Sanctum-style bearer token (random token, only its hash is stored; logout revokes it).
- Prices are always read from the database at checkout, and stock is locked and decremented inside a transaction.
- Payment flow: checkout -> `pending_payment` -> screenshot upload -> `payment_under_review` -> admin approve (`processing`) or reject (back to `pending_payment` with a reason, customer can resubmit).
- Payment screenshots are private; only admins can fetch them via `/admin/payments/:id/screenshot`.
- Products are soft-deleted so old orders keep their history.
- Unpaid orders are cancelled and restocked after `ORDER_HOLD_HOURS` (default 24), and the customer is told in their inbox.
- Login and sign-up are rate limited, and standard security headers are on.
- If something fails with a database error, run `node check-database.js` to see what differs from what the app needs, and `node check-database.js --fix` to repair it. Your data is kept.
- Email: set the SMTP_* lines in `.env` (see DEPLOY.md, step 4b). Without them, emails are printed in the terminal instead of sent, which is handy for testing: the reset and confirm links appear there.
- Password reset and email confirmation links work once, expire (1 hour and 3 days), and only a hash is stored. Resetting a password signs the person out everywhere.
- Rate limits: reviews (10/hour), messages (5/hour), orders (20/hour), reset requests (5/hour), plus sign-in and sign-up.
