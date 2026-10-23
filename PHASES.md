# What each phase added

Everything in this zip is cumulative: it already contains all five phases working together.
This list shows where each phase lives, in case you want to read or change one part.

## Phase 1: Backend API  (`backend/`)
- `schema.sql`: all MySQL tables from your spec, plus tokens, wishlist and inbox tables
- `src/routes/auth.js`, `products.js`, `account.js`, `orders.js`, `admin.js`
- `src/middleware/` (login check, admin check, image uploads), `src/db.js`, `src/utils.js`
- `src/server.js`, `src/setup.js` (creates database, admin user, categories)

## Phase 2: Storefront  (`frontend/`)
- `src/pages/customer/`: Home, ProductDetail, Cart, Checkout, OrderPlaced, Login, Register, Help
- `src/components/layout/`: Navbar (live search, cart badge, account menu), Footer, Layout
- `src/components/customer/`: ProductCard, ReviewSection, MobileMoneyPrompt
- `src/store/`: authStore, cartStore, uiStore (dark/light theme)
- `src/services/`, `src/types/`, `src/routes/`, `src/index.css` (colours and fonts)
- `src/pages/customer/Account/`: AccountLayout, Overview, Orders

## Phase 3: Admin console  (`frontend/`)
- `src/pages/admin/`: AdminLayout, AdminDashboard, AdminProducts, AdminOrders, AdminCustomers, AdminInquiries
- `src/components/admin/`: ProductFormModal, PaymentViewerModal
- `src/services/adminService.ts`, `src/types/admin.d.ts`, `src/routes/AdminRoute.tsx`

## Phase 4: Wishlist and inbox  (`frontend/`)
- `src/pages/customer/Account/Wishlist.tsx`, `Inbox.tsx`
- `src/components/customer/WishlistButton.tsx`
- `src/store/wishlistStore.ts`, `inboxStore.ts`, `src/types/account.d.ts`

## Phase 5: Retry payment and going live
- `frontend/src/components/customer/PayAgainModal.tsx` (used on the Orders page)
- `backend/src/jobs.js` (cancels unpaid orders after 24 hours), rate limiting and security headers in `server.js`
- `DEPLOY.md`: step by step guide to put the site online

## Run it locally
1. Start MySQL.
2. `cd backend`, copy `.env.example` to `.env` and fill it in, then `npm install`, `npm run db:setup`, `npm run dev`.
3. `cd frontend`, then `npm install` and `npm run dev`. Open http://localhost:5173.

## Extra: accounts and email
- `backend/src/mailer.js`, `src/middleware/limits.js`, `src/routes/auth.js` (verify email, forgot and reset password)
- `frontend/src/pages/customer/ForgotPassword.tsx`, `ResetPassword.tsx`, `VerifyEmail.tsx`, `components/layout/VerifyBanner.tsx`
- Order and payment updates are now also sent by email, not only to the site inbox

## Documents
- `docs/`: PRD, MVP scope, development plan, technical requirements, UI plan and user flows (start with `docs/README.md`)
