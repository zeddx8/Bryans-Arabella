# Product Requirements Document (PRD)

**Product:** Bryans Arabella Collection, an online shop for high quality, affordable ladies' bags
**Version:** 1.0, October 2026
**Owner:** Shop owner
**Status:** MVP built (Phases 1 to 5). Backend hosting and launch are the remaining steps.

---

## 1. Summary
Bryans Arabella Collection sells ladies' bags to customers in Ghana. Shoppers browse bags, pay by mobile money (MTN, Telecel or AirtelTigo), and upload a screenshot of their payment. The shop owner checks each payment against her mobile money records and then approves or rejects it. There is no card payment and no payment gateway: payment is **manual by design**.

## 2. Goals
| # | Goal | How we know it works |
|---|---|---|
| G1 | A shopper can go from landing page to a placed order in under 3 minutes on a phone | Timed test run on a mid-range phone |
| G2 | The owner can add a bag with photos in under 2 minutes | Timed test run |
| G3 | The owner can verify a payment in under 1 minute | Timed test run |
| G4 | No order is lost, oversold, or paid twice | The stock and payment tests in the technical document pass |
| G5 | Customers always know where their order stands | Every status change creates an inbox message and an email |

Business targets (monthly orders, conversion rate and so on) should be set by the owner after the first month of real data. They are not guessed here.

## 3. Users
**Customer ("Ama"):** a woman in Ghana shopping on her phone, comfortable with mobile money, not comfortable with cards. Wants to see the bag clearly, pay in a way she trusts, and know when it will arrive.

**Admin ("the owner"):** runs the shop, often from a laptop or phone. Not technical. Needs to add stock, check payments safely, and answer questions without learning a complicated system.

## 4. Scope
See `02-mvp-scope.md` for what is in the first release and what is deferred.

## 5. Functional requirements
Status key: **Built** = working and tested. **Partial** = works with a limit noted. **Planned** = not built.

### 5.1 Storefront
| ID | Requirement | Status |
|---|---|---|
| FR-01 | Header with brand logo left, global search, account menu, help link, cart badge with live count | Built |
| FR-02 | Real-time search by name, description or brand with suggestions as the shopper types | Built |
| FR-03 | Responsive product grid; each card shows main image, name, brand, price in GH₵, and an Add to cart button | Built |
| FR-04 | Filter by category and brand, sort by newest or price, paginated | Built |
| FR-05 | Product page: image gallery with thumbnails and zoom, title, brand, SKU, price, stock status, full description | Built |
| FR-06 | Reviews: list plus submission form (stars, title, body); one review per customer per bag | Built |
| FR-07 | "You may also like" carousel from the same category or brand | Built |
| FR-08 | Dark and light theme | Built |

### 5.2 Customer account
| ID | Requirement | Status |
|---|---|---|
| FR-10 | Register, sign in, sign out; sessions last 30 days | Built |
| FR-11 | Email confirmation link after registration | Built (needs email set up to send) |
| FR-12 | Forgot password by email; link works once for 1 hour; resetting signs the person out everywhere | Built (needs email set up to send) |
| FR-13 | Account overview: name, email, phone, default address | Built |
| FR-14 | Order history, paginated, with status tags and rejection reasons | Built |
| FR-15 | Submit or resend payment proof on an unpaid order | Built |
| FR-16 | Wishlist (heart on cards and product page, wishlist page) | Built |
| FR-17 | Inbox: order and payment messages, plus a form to message the shop | Built |
| FR-18 | Collapsible account sidebar | Partial: sidebar exists and scrolls on phones; it does not collapse |
| FR-19 | Edit name, phone and addresses on a dedicated "Account management" page | Partial: the API supports it; there is no screen yet. Addresses are added at checkout |

### 5.3 Cart and checkout
| ID | Requirement | Status |
|---|---|---|
| FR-20 | Cart page: quantity up and down, remove line, subtotal; saved in the browser | Built |
| FR-21 | Checkout: delivery address, itemised totals (subtotal, flat shipping fee, grand total) | Built |
| FR-22 | Choose MTN, Telecel or AirtelTigo; the merchant number and account name appear once chosen, with a copy button | Built |
| FR-23 | Upload payment screenshot (JPG, PNG, WEBP, up to 6 MB) and confirm with "I have paid" | Built |
| FR-24 | Order is created as awaiting payment, then moves to "payment under review" when proof arrives | Built |
| FR-25 | Unpaid orders are cancelled and restocked after 24 hours (configurable) | Built |

### 5.4 Administrator
| ID | Requirement | Status |
|---|---|---|
| FR-30 | Admin-only area; the server enforces it, not just the screens | Built |
| FR-31 | Create a bag: multiple photos, name, slug, brand, category (existing or new), SKU, cost price, selling price, stock, description | Built |
| FR-32 | Rich text descriptions | Partial: plain text with line breaks kept |
| FR-33 | Search and filter the catalogue; stock badges; edit; add and remove photos; choose main photo; hide from shop | Built |
| FR-34 | Archive (soft delete) a bag so past orders keep their history | Built |
| FR-35 | Payment console: order list with "needs review" first; modal shows the screenshot beside the amount to match | Built |
| FR-36 | Approve payment (order moves to processing, customer is notified) | Built |
| FR-37 | Reject payment with a reason (incorrect amount, unreadable screenshot, duplicate, not found, or custom); customer is told and can resend | Built |
| FR-38 | Mark orders shipped or delivered; cancel and restock | Built |
| FR-39 | Customer list with registered addresses | Built |
| FR-40 | Customer inquiries with reply (reply lands in the customer's inbox and email) | Built |
| FR-41 | Overview: payments waiting, sales, orders, customers, bags, low stock | Built |

### 5.5 Notifications
| ID | Requirement | Status |
|---|---|---|
| FR-50 | Every order or payment update creates an inbox message | Built |
| FR-51 | The same update is emailed (welcome and confirm, payment received, approved, rejected, shipped, delivered, cancelled, replies) | Built (needs email set up) |
| FR-52 | SMS notifications | Planned |

## 6. Business rules
1. **Prices come from the database at checkout.** The browser's idea of a price is never trusted.
2. **Stock is taken when the order is placed** and returned if the order is cancelled or expires.
3. **Shipping is a flat fee** set by the owner in settings (default GH₵ 30).
4. **An order can have several payment attempts**; only the latest counts. A rejected payment puts the order back to "awaiting payment".
5. **A bag with order history is never deleted**, only archived.
6. **Only a verified payment moves an order forward.** Shipping an unpaid order is blocked by the system.
7. **Payment screenshots are private** and visible only to admins.

## 7. Non-functional requirements
| Area | Requirement |
|---|---|
| Mobile first | Fully usable at 360 px wide; most customers will be on phones |
| Speed | Pages load quickly on a mobile connection; images are lazy loaded. Formal targets to be measured after launch |
| Accessibility | Keyboard use, visible focus, skip link, labelled forms, screen reader labels on icon buttons. A full audit is still to do (see `05-ui-plan.md`) |
| Security | See `04-technical-requirements-document.md`, section 9 |
| Reliability | A failed email never blocks a sign-up or an order; the server survives a database outage and recovers |
| Data safety | Daily database and photo backups (owner's responsibility; steps in `DEPLOY.md`) |
| Browsers | Current Chrome, Edge, Safari and Firefox, including their mobile versions |

## 8. Differences from the original specification
| Original spec | What was built | Why |
|---|---|---|
| Laravel Sanctum | Node.js and Express with a Sanctum-style token (random token, hash stored, revoked on logout) | Owner chose a Node backend that runs with npm on Windows |
| Order status `pending_payment_verification` | `payment_under_review` | Matches the database enum in the spec's own schema |
| Rich text description | Plain text with line breaks | Simpler and safer for the MVP |
| Admin "support tickets" | Customer messages and replies (Inquiries page) | Covers the same need without a ticketing system |

## 9. Assumptions and open questions
**Assumptions:** the owner checks her mobile money records before approving; customers are in Ghana; the shop ships one flat rate nationwide.

**Open questions for the owner:**
1. Should delivery cost differ by region (for example Accra versus other regions)?
2. What is the returns and exchange policy? It should be written on the Help page.
3. Should customers be able to cancel their own unpaid order?
4. How long does delivery take? The Help page needs a promise the shop can keep.
5. Will more than one person manage the shop? Today there is one kind of admin.
6. Is the 24-hour payment window right for your customers?

## 10. Risks
| Risk | Effect | Mitigation |
|---|---|---|
| Fake payment screenshots | Money lost | Always confirm in the real mobile money records, never from the screenshot alone |
| Backend stays on a laptop | Shop down when the laptop is off | Move the backend to a server (see `03-development-plan.md`) |
| Email not set up | No reset or confirmation emails | Set up SMTP before launch; test with a real address |
| Photos and screenshots stored on one disk | Loss if the disk fails | Daily off-server backups |
