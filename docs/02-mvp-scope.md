# MVP Scope

**Product:** Bryans Arabella Collection
**Version:** 1.0, October 2026

## 1. The MVP in one sentence
A customer can find a bag, pay for it by mobile money with a screenshot, and track the order, while the owner can add bags, verify payments, and move orders to delivered, all without any other tool.

## 2. In the MVP (built)
| Area | What is included |
|---|---|
| Browsing | Home with hero and new arrivals, filters, sort, pagination, live search, product page with gallery and zoom, reviews, suggested bags |
| Buying | Cart, address, checkout, mobile money instructions for MTN, Telecel and AirtelTigo, screenshot upload, "I have paid" |
| Customer account | Register, sign in, forgot password, confirm email, overview, orders with status, resend payment proof, wishlist, inbox and messaging |
| Owner tools | Overview numbers, add and edit bags with photos, archive, payment review with approve and reject (with reasons), order status updates, customer list, inquiries with replies |
| Messages | Inbox messages plus email for every order or payment update |
| Safety | Admin access enforced on the server, private payment screenshots, rate limits, safe image uploads, 30-day sign-ins, hashed passwords |
| Look | Dark and light theme, mobile first |

## 3. Deliberately left out of the MVP
| Feature | Why it waits |
|---|---|
| Card or online payment gateway | The shop is mobile money only by decision |
| SMS notifications | Email and inbox cover the need first; SMS costs money per message |
| Discount codes and promotions | Not needed to take the first orders |
| Delivery fee by region | Needs the owner's rates; flat fee works for launch |
| Product variants (colour, size) | Each colour can be its own listing for now |
| Rich text descriptions | Plain text is enough |
| Multiple admin roles | One owner account at the start |
| Two-step login for admin | Strong password first; add later |
| Returns and refunds screens | Handled by message and by hand at first |
| Analytics and reports | The overview numbers are enough at the start |
| Automatic mobile money confirmation | Needs a payment provider; the shop's model is manual verification |
| Account management screen (edit profile and addresses) | API exists; screen is the first small addition after launch |
| Order tracking by courier | Status updates by the owner cover it |

## 4. Acceptance criteria
The MVP is done when all of these are true on the **live** site, not just on a laptop:

**Shopper**
1. I can open the site on my phone, search for a bag, and open it.
2. I can register, and I receive a confirmation email.
3. I can place an order and upload a payment screenshot.
4. I see my order as "payment under review", and later as "preparing", "shipped" or "delivered".
5. If my payment is rejected, I see why and can send a new screenshot.
6. If I forget my password, I can reset it from the email.

**Owner**
7. I can sign in as admin and customers cannot.
8. I can add a bag with several photos and see it in the shop.
9. I can open a payment, see the screenshot and the amount to match, and approve or reject it.
10. After I approve, the customer is told by inbox and email.
11. I can mark an order shipped and delivered.
12. I can reply to a customer's message.

**System**
13. Two customers cannot buy the last bag at the same time.
14. An unpaid order is cancelled after 24 hours and the bags go back on sale.
15. Photos and payment screenshots survive a server restart.
16. A backup of the database and photos exists and has been restored at least once as a test.

## 5. Launch checklist
- [ ] Backend running on a server with HTTPS and a domain
- [ ] Website deployed on Vercel with `VITE_API_URL` pointing at the backend
- [ ] `CLIENT_URL` and `PUBLIC_URL` set on the backend and the backend restarted
- [ ] Real mobile money numbers and account names set
- [ ] Strong admin password (not `admin123`)
- [ ] Email working and tested with a real inbox
- [ ] Shipping fee confirmed
- [ ] Help page updated with delivery time and returns policy
- [ ] First 5 to 10 real bags added with good photos
- [ ] One full test order, start to delivered, then cancelled
- [ ] Backup running and restore tested
- [ ] GitHub repository private

## 6. After launch: first improvements
1. Account management screen (edit profile and addresses)
2. Delivery fee by region
3. SMS for key updates
4. Product colours and sizes
5. Discount codes
6. Monthly sales summary for the owner

## 7. What would change the scope
Add to the MVP only if one of these happens: customers keep asking for card payment, the owner finds payment checking too slow, or orders grow beyond what one person can verify by hand. Until then, adding features adds risk without adding sales.
