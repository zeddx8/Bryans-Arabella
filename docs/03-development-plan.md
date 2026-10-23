# Development Plan

**Product:** Bryans Arabella Collection
**Version:** 1.0, October 2026

Effort sizes are estimates for one developer: **S** is under a day, **M** is 1 to 3 days, **L** is about a week. Treat them as guides, not promises.

## 1. Where the project stands
| Phase | What it delivered | Status |
|---|---|---|
| 1. Backend API | MySQL schema, sign-in, products, checkout, payments, admin endpoints | Done |
| 2. Storefront | Browsing, search, product page, cart, mobile money checkout, sign-in, account overview and orders | Done |
| 3. Admin console | Products, payment verification, order status, customers, inquiries | Done |
| 4. Wishlist and inbox | Heart buttons, wishlist page, inbox, "message us" | Done |
| 5. Retry payment and going live | Resend payment proof, 24-hour order expiry, rate limits, security headers, deployment guide | Done |
| Extra: accounts and email | Email confirmation, password reset, order emails, review and message limits, security fixes | Done |
| 6. Launch | Backend hosting, domain, email, real data, backups | **Next** |
| 7. After launch | Improvements from real use | Later |

The website is deployed on Vercel. The backend still runs only on a laptop, so the live site cannot yet show bags. Phase 6 fixes that.

## 2. Phase 6: Launch (the work that remains)
| # | Task | Size | Done when |
|---|---|---|---|
| 6.1 | Choose backend hosting: a small VPS (recommended) or an always-on host such as Railway or Render. Check each provider's current price and whether file storage costs extra | S | Decision made |
| 6.2 | Buy or point a domain; make `api.yourdomain.com` point to the server | S | The name resolves to the server |
| 6.3 | Install Node, MySQL, nginx, pm2; create a database user; run `npm run db:setup` (`DEPLOY.md` steps 1 to 4) | M | `/api/v1/health` shows `{"ok":true}` over https |
| 6.4 | Set backend `.env`: `CLIENT_URL`, `PUBLIC_URL`, database, admin, shipping, mobile money numbers | S | Values checked line by line |
| 6.5 | Set `VITE_API_URL` in Vercel and redeploy | S | The live site loads bags |
| 6.6 | Set up email (Gmail app password, or a dedicated service) and test every email type | S | Real emails arrive in an inbox, not spam |
| 6.7 | Strong admin password; make the GitHub repository private | S | Checked |
| 6.8 | Add the first real bags with photos | M | At least 5 bags live |
| 6.9 | Full test order from a phone: place, pay, reject, resend, approve, ship, deliver | S | Every step works on the live site |
| 6.10 | Daily backups of the database and the uploads folder, copied off the server; test a restore | M | A restore has been done once |
| 6.11 | Write the Help page content: delivery time, returns, contact | S | Owner approves the text |
| 6.12 | Run `npm audit` in both folders and update packages | S | Zero known vulnerabilities |

**Exit criteria:** all checklist items in `02-mvp-scope.md` are ticked.

## 3. Phase 7: After launch (ordered by value)
| # | Item | Size |
|---|---|---|
| 7.1 | Account management screen (edit profile, edit and remove addresses) | S |
| 7.2 | Delivery fee by region | M |
| 7.3 | Automated tests that run on every push (see section 5) | M |
| 7.4 | Colour and size options per bag | L |
| 7.5 | Discount codes | M |
| 7.6 | SMS for payment confirmed and shipped | M |
| 7.7 | Move uploads to cloud storage (needed if the backend ever runs on Vercel or several servers) | M |
| 7.8 | Admin two-step login | M |
| 7.9 | Rich text product descriptions | S |
| 7.10 | Monthly sales and top bags report | M |

## 4. How we work
**Environments**
| Environment | Website | Backend | Database |
|---|---|---|---|
| Local | `localhost:5173` | `localhost:4000` | MySQL on the laptop |
| Production | Vercel | Server with https | MySQL on the server |

**Source control.** Code lives in one GitHub repository with `backend/` and `frontend/`. Work happens on `main` for now; once real customers exist, use short branches and review before merging. `.env` files and `node_modules` are never committed (the `.gitignore` enforces this).

**Releasing**
- *Website:* push to GitHub; Vercel builds and publishes.
- *Backend:* upload or pull the code, run `npm install --omit=dev`, then `pm2 restart arabella-api`.
- *Database changes:* run `npm run db:setup` (safe to repeat) or `node check-database.js --fix` after a change.

**Rule for every change:** the owner can undo it. Back up the database before any database change.

## 5. Testing plan
**Done so far** (run by hand against a MariaDB 10.11 test database, with a real mail server capturing emails):
- 27 end-to-end checks of the order journey: admin login, add bag with photos, public listing, register, review, wishlist, address, checkout, payment, rejection, resubmission, approval, shipping, inbox, messages, reply, stats, stock change, archive, logout.
- 23 checks of accounts and email: confirmation, reset, link reuse, unknown email, sessions revoked after reset, review rule, message limit, "verified email required" mode.
- Upload safety (fake images refused) and 30-day token expiry.
- Type checking and production build of the website after every phase.

**Not done yet**
- The test scripts are not saved in the repository, so they cannot be re-run automatically. Task 7.3 turns them into a proper test suite.
- Tests were not run against a real MySQL server, only MariaDB. Run the owner's first full test order on the real server.
- No browser test of every page on real phones. Do this in task 6.9.
- No load testing. Not needed at launch size; revisit if traffic grows.

**Manual test script for each release:** register, confirm email, add to cart, checkout with screenshot, approve as admin, check the customer sees "preparing" and an email, mark shipped, mark delivered.

## 6. Roles
| Role | Who | Responsibility |
|---|---|---|
| Owner | Shop owner | Decisions in `01-product-requirements-document.md` section 9; checks payments; adds bags |
| Developer | Whoever maintains the code | Hosting, updates, backups, fixes |
| Reviewer | Anyone technical the owner trusts | Looks over big changes before release |

## 7. Risk register
| Risk | Likelihood | Effect | Response |
|---|---|---|---|
| Backend stays on a laptop | High until Phase 6 | Shop unusable | Do Phase 6 first |
| Fake payment proofs | Medium | Lost money | Check real records; never approve from the screenshot alone |
| Uploads lost on a server failure | Low | Lost photos and proofs | Daily off-server backups |
| One person is the only admin and is unavailable | Medium | Orders wait | Add a second admin login later (task 7.8 and roles) |
| A dependency gets a security warning | Medium | Exposure | Monthly `npm audit`, update promptly |
| Email lands in spam | Medium | Customers miss updates | Inbox messages always exist as backup; switch to a dedicated email service if needed |
| Gmail daily sending limit | Low at start | Emails stop | Move to a dedicated email service as volume grows |

## 8. Definition of done (for any task)
1. It works on the live site, on a phone.
2. It is tested with at least the manual script above.
3. `npm audit` is clean.
4. Documents are updated if behaviour changed.
5. The owner has seen it working.
