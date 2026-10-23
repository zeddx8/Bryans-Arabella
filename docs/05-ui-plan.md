# UI Plan

**Product:** Bryans Arabella Collection
**Version:** 1.0, October 2026

## 1. Design intent
A quiet, confident luxury feel at an honest price. Lots of space, large serif headings, small tracked-out sans labels, and photography doing the talking. Mobile first, because most customers shop on phones. Dark and light themes are both first class.

**Principles**
1. **Photos lead.** Text and chrome stay out of the way.
2. **One clear action per screen.** Add to cart, Go to checkout, I have paid.
3. **Say what happens next.** Every screen after payment tells the customer what the shop is doing now.
4. **No surprises with money.** Totals, delivery fee and the amount to send are always visible and match.
5. **Calm errors.** Plain words, a reason, and a way to fix it.

## 2. Visual system

### Colour
Colours are variables, so each theme swaps them in one place (`frontend/src/index.css`).
| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#F6F4F2` | `#131116` | Page background |
| `surface` | `#FFFFFF` | `#1B181F` | Menus and pop-ups |
| `tone` | `#ECE8E5` | `#241F28` | Inputs, panels, image placeholders |
| `ink` | `#1B1820` | `#F2EEF1` | Main text, solid buttons |
| `muted` | `#7B7580` | `#9B93A0` | Secondary text |
| `line` | `#DDD7D4` | `#332D38` | Rare dividers |
| `accent` | `#6E1F3A` | `#D9A3B4` | Links on hover, errors, badges, focus ring. Used sparingly |
| `accent-ink` | `#FFFFFF` | `#1B181F` | Text on accent |

### Type
| Role | Font | Notes |
|---|---|---|
| Headings, prices on big panels, bag names | Bodoni Moda (serif) | Regular weight; large sizes (30 to 72 px) |
| Everything else | Jost (sans) | Weights 300, 400, 500 |
| Small labels, buttons, table headers | Jost, 10 to 11 px, uppercase, wide letter spacing | |
Fonts load from Google Fonts with system fallbacks, so text shows even if they fail.

### Space and layout
- Content width up to 80rem, side padding 20 px on phones and 32 px from 768 px up.
- Breakpoints: 640, 768, 1024 px.
- Product grid: 2 columns on phones, 3 from 768 px, 4 from 1024 px.
- Sharp corners (no rounding) for buttons, inputs and images. Few borders; panels are separated by tone and space.

### Motion
Short colour fades on hover; the second product photo fades in on hover; zoom on the product photo follows the pointer. Everything is switched off for people who ask their device for reduced motion.

## 3. Component inventory
| Group | Components |
|---|---|
| Common | Button (solid, line, ghost, with busy spinner), Input, Badge (order status), Modal, Stars, Quantity stepper, Spinner, Icons |
| Layout | Navbar, Footer, Layout (skip link, banner), Account sidebar, Admin sidebar, Verify banner |
| Customer | Product card, Wishlist button, Review section, Mobile money prompt, Pay again modal |
| Admin | Product form modal, Payment viewer modal |

## 4. Site map
```
/                       Home (hero, filters, new arrivals)      public
/bags/:slug             Product page                            public
/cart                   Cart                                    public
/help                   Help and how to pay                     public
/login  /register       Sign in, create account                 public
/forgot-password        Ask for reset link                      public
/reset-password         Choose a new password (from email)      public
/verify-email           Confirm email (from email)              public
/checkout               Delivery and payment                    signed in
/order/:id/placed       Thank you                               signed in
/account                Overview                                signed in
/account/orders         Orders                                  signed in
/account/wishlist       Wishlist                                signed in
/account/inbox          Inbox and message us                    signed in
/admin                  Overview                                admin
/admin/orders           Orders and payments                     admin
/admin/products         Products                                admin
/admin/customers        Customers                               admin
/admin/inquiries        Inquiries                               admin
*                       Page not found                          public
```

## 5. Screen plans
Wireframes are simplified. `[ ]` is a button or input.

### 5.1 Header (every page)
```
BRYANS ARABELLA   [ Search by name, brand or description ]   HELP  (user) NAME  (moon)  (bag 2)
```
- On phones the search drops to its own row under the logo.
- Search suggests up to 5 bags with photo, name, brand, price; Enter shows full results.
- Account menu: signed out shows Sign in and Create account; signed in shows My account, Orders, Inbox (with unread count), Wishlist, Admin console (admins), Log out.
- A small dot appears on the account icon when there are unread messages.
- A thin bar under the header asks unconfirmed customers to confirm their email, with "Send it again".

### 5.2 Home
```
+--------------------------------------------------------------+
|  [ full-width photo of the newest bag, darkened ]            |
|  Carry something beautiful          (large serif)            |
|  Quality ladies' bags at fair prices. Pay with MTN, Telecel..|
|  [ SHOP NEW ARRIVALS ]                                       |
+--------------------------------------------------------------+
 New arrivals            [All categories v] [All brands v] [Newest v]
 48 bags
 [photo ] [photo ] [photo ] [photo ]      (hover shows 2nd photo, heart top right)
 BRAND    BRAND    BRAND    BRAND
 Bag name Bag name Bag name Bag name      GH₵ 250.00
 [Add to cart] ...
              < Previous   Page 1 of 4   Next >
```
- With no photo yet, the hero is a plain tone panel with dark text.
- Searching or filtering hides the hero and shows "Results for ...".
- Empty states: "Our first bags arrive soon" (no products) and "No bags match your search" with a clear button.

### 5.3 Product page
```
 All bags / Tote Bags
 [thumbs] [  large photo, zooms on hover  ]     BRAND
 [      ] [                               ]     Bag name (large serif)
 [      ] [                               ]     ★★★★☆ 12 reviews
                                                GH₵ 250.00
                                                In stock · SKU ARB-001
                                                [- 1 +] [ ADD TO CART ]
                                                ♡ Save to wishlist
                                                + Details   (open)
                                                + Delivery and payment
                                                + Care
 Reviews  (rating summary, form, list)
 You may also like  [swipeable row of cards]
```
- The right column stays in view while scrolling on large screens.
- On phones the thumbnails sit under the main photo.
- Low stock ("Only 2 left") and sold out are shown in words, and the button is disabled when sold out or when the cart already holds all of the stock.

### 5.4 Cart
Left: lines with photo, brand, name, price, quantity stepper, line total, Remove. Right: summary with subtotal, "Delivery added at checkout", and Go to checkout. Empty cart: short message and a Browse bags button.

### 5.5 Checkout
```
 Checkout
 Delivery address                         | Your order
 ( ) Ama, 024..., 1 Palm St, Accra        |  [photo] Bag name  Qty 1   GH₵ 250
 ( ) Use a new address                    |  Subtotal                  GH₵ 250
   [name] [phone] [street] [city] [region]|  Delivery                  GH₵  30
 Payment                                  |  Total                     GH₵ 280
   Pay with: [MTN] [Telecel] [AirtelTigo] |  [ I HAVE PAID ]
   Send GH₵ 280 by MTN to:  0240000000    |  We check your screenshot...
   Account name: Bryans Arabella [Copy]   |
   Transaction ID (optional) [        ]   |
   Payment screenshot  [preview] [Choose] |
```
- The number and account name appear only after a provider is chosen.
- If the order is created but the upload fails, the page stays and says the order is saved; pressing the button again only retries the upload.
- Errors show inside the summary, next to the button.

### 5.6 Thank you
Large "Thank you. Order #12 is in", one sentence on what happens next, buttons Track my order and Keep shopping.

### 5.7 Sign in, create account, reset
Narrow centred forms. Sign in links to Forgot password. After reset, the person is told they were signed out everywhere and sent to Sign in. Email links open Verify email or Reset password pages with clear success and "ask for a new link" states.

### 5.8 Account
Left menu (Overview, Orders, Inbox with unread count, Wishlist, Log out); on phones it becomes a horizontal row.
- **Overview:** details and default address.
- **Orders:** card per order with date, status badge, items, total; rejected payments show the reason; unpaid orders show **Submit payment proof** (or **Send new payment proof**) and "Reserved for you until ...".
- **Wishlist:** grid with Add to cart and Remove.
- **Inbox:** list with unread dots; tap to open; **Message us** form at the top.

### 5.9 Admin
Left menu on desktop, scrolling row on phones.
- **Overview:** large "payments waiting" number linking to the review list, then sales, orders, customers, bags, and a low stock note.
- **Orders and payments:** tabs (All, Needs review, Awaiting payment, Preparing, Shipped, Delivered, Cancelled); table with order, customer, total, status, action. The modal shows the screenshot on the left; on the right the **amount to match** (large), provider, transaction ID, customer phone, address and items. Buttons: Approve payment, Reject payment (reason list plus "Other"), then Mark as shipped, Mark as delivered, Cancel and restock.
- **Products:** search and category filter; table with photo, name, brand and SKU, category, price, stock badge, Edit, Archive. The form modal has fields in two columns, photo tiles (main photo choice, remove), visible-in-shop switch.
- **Customers:** searchable table; addresses open in a pop-up.
- **Inquiries:** each message with Reply that expands a box.

## 6. States every screen must handle
| State | Treatment |
|---|---|
| Loading | Small spinner centred; lists dim slightly while refreshing |
| Empty | One friendly sentence and a next step |
| Error | Plain message in the accent colour, with Try again where it helps |
| Success | Short confirmation text; never a popup that blocks |
| Offline or server down | "We could not reach the server. Check your connection and try again." |

## 7. Accessibility
**Built in:** skip to content link; visible focus ring in the accent colour; labelled form fields; icon buttons have text labels for screen readers; status messages announced; images have descriptive text where meaningful; keyboard use for menus, dialogs (Escape closes), tabs and the quantity stepper; reduced motion respected.

**To fix or check**
1. **Contrast:** light-theme muted text (`#7B7580` on `#F6F4F2`) measures about 4.1 to 1, below the 4.5 to 1 expected for small text. Darken the light `muted` to around `#6A646F` and re-check. The dark theme passes.
2. Run a full automated audit (for example Lighthouse) and a screen reader pass on checkout and the payment modal.
3. Confirm touch targets are at least 44 px on phones, especially the small text buttons such as Remove and Edit.

## 8. Known UI gaps
| Gap | Plan |
|---|---|
| No favicon or share image (the browser console shows a 404 for it) | Add a logo icon and a share image |
| Account sidebar does not collapse | Add collapse on phones, with the Close and Logout item from the spec |
| No Account management screen | Planned right after launch |
| Admin tables scroll sideways on small phones | Switch to stacked cards on phones |
| No order detail page | Orders page already shows items and status; add later if asked |
| Product photos are not resized | Ask for sensible photo sizes, or add resizing later |
| Spinners instead of skeleton loaders | Optional polish |

## 9. Voice and wording
Warm, short, and specific. Say "Send GH₵ 280 by MTN to 0240000000", not "Complete your transaction". Say what is happening: "We are checking your payment now." Never blame the customer: "We could not verify your payment: Incorrect amount. Please send the exact total and a clear screenshot."
