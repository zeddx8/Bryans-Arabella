# User Flows

**Product:** Bryans Arabella Collection
**Version:** 1.0, October 2026

The diagrams use Mermaid. They display automatically on GitHub and in most Markdown viewers.

## 1. Shopper: from landing to placed order
```mermaid
flowchart TD
  A[Land on home page] --> B{Know what you want?}
  B -- Yes --> C[Type in search, pick a suggestion]
  B -- No --> D[Browse grid, filter by category or brand]
  C --> E[Product page]
  D --> E
  E --> F{In stock?}
  F -- No --> G[See Sold out, save to wishlist or keep browsing]
  F -- Yes --> H[Add to cart]
  H --> I[Cart: change quantities, remove]
  I --> J[Go to checkout]
  J --> K{Signed in?}
  K -- No --> L[Sign in or create account, then return to checkout]
  K -- Yes --> M[Choose or enter delivery address]
  L --> M
  M --> N[Choose MTN, Telecel or AirtelTigo]
  N --> O[See number and account name, send exact total from phone]
  O --> P[Upload screenshot, optional transaction ID]
  P --> Q[Press I have paid]
  Q --> R{Order and upload accepted?}
  R -- Yes --> S[Thank you page: payment under review]
  R -- Order saved, upload failed --> T[Stay on checkout, press again to retry upload]
  T --> R
  S --> U[Track in Orders, updates arrive in Inbox and email]
```

## 2. Registration and email confirmation
```mermaid
flowchart TD
  A[Create account form] --> B{Valid email and password of 8 or more?}
  B -- No --> A
  B -- Yes --> C[Account created and signed in]
  C --> D[Confirmation email sent]
  C --> E[Bar at top: Please confirm your email]
  D --> F[Customer opens link]
  F --> G{Link valid, unused, under 3 days old?}
  G -- Yes --> H[Email confirmed, bar disappears]
  G -- No --> I[Message: ask for a new link]
  I --> J[Send it again from the bar]
  J --> D
```
If the owner turns on "require email confirmation", checkout shows a clear message until the email is confirmed.

## 3. Forgot password
```mermaid
flowchart TD
  A[Sign in page] --> B[Forgot your password?]
  B --> C[Enter email]
  C --> D[Same message every time: if that email has an account, a link is on its way]
  D --> E[Email with link, valid for 1 hour]
  E --> F[Choose new password twice]
  F --> G{Link valid and password 8 or more?}
  G -- No --> H[Explain, offer a new link]
  G -- Yes --> I[Password changed, signed out on every device]
  I --> J[Sign in with new password]
```

## 4. Payment: review, rejection, and retry
```mermaid
flowchart TD
  A[Customer uploads proof] --> B[Order: payment under review]
  B --> C[Customer gets: We received your payment]
  B --> D[Owner opens the order]
  D --> E[Compare screenshot, amount, and her real mobile money records]
  E --> F{Payment genuine and correct?}
  F -- Yes --> G[Approve payment]
  G --> H[Order: preparing. Customer notified by inbox and email]
  F -- No --> I[Reject with reason]
  I --> J[Order back to awaiting payment. Customer told the reason]
  J --> K[Customer opens Orders, presses Send new payment proof]
  K --> A
  J --> L{24 hours pass with no proof?}
  L -- Yes --> M[Order cancelled, bags back in stock, customer told]
```

## 5. After approval: fulfilment
```mermaid
flowchart LR
  A[Preparing] --> B[Owner marks Shipped]
  B --> C[Customer notified]
  C --> D[Owner marks Delivered]
  D --> E[Customer notified]
  A -. owner cancels .-> X[Cancelled and restocked]
  B -. owner cancels .-> X
```

## 6. Owner: add a bag
```mermaid
flowchart TD
  A[Sign in as admin] --> B[Products]
  B --> C[Add a bag]
  C --> D[Fill name, brand, category or new category, SKU, prices, stock, description]
  D --> E[Add photos, first is main]
  E --> F{Valid and at least one photo?}
  F -- No --> D
  F -- Yes --> G[Saved. Bag appears in the shop]
  G --> H[Later: Edit to change stock, photos, or hide]
  H --> I[Archive when discontinued. Order history is kept]
```

## 7. Owner: a normal day
```mermaid
flowchart TD
  A[Sign in] --> B[Overview: payments waiting]
  B --> C{Any waiting?}
  C -- Yes --> D[Open Orders and payments, Needs review]
  D --> E[Review each payment: approve or reject]
  C -- No --> F[Check Preparing and Shipped orders]
  E --> F
  F --> G[Mark shipped or delivered]
  G --> H[Inquiries: reply to messages]
  H --> I[Products: check low stock, add new bags]
```

## 8. Wishlist and inbox
```mermaid
flowchart TD
  A[Tap heart on a bag] --> B{Signed in?}
  B -- No --> C[Sign in, return to the same page]
  B -- Yes --> D[Bag saved immediately]
  D --> E[Wishlist page: add to cart or remove]
  F[Order or payment update] --> G[Inbox message plus email]
  G --> H[Unread dot on account icon and Inbox count]
  H --> I[Customer opens message, marked read]
  J[Customer presses Message us] --> K[Owner sees it in Inquiries]
  K --> L[Owner replies, reply arrives in inbox and email]
```

## 9. Access rules
| Visitor | Can do | Cannot do |
|---|---|---|
| Not signed in | Browse, search, view bags and reviews, use the cart, read Help | Check out, review, wishlist, inbox, account |
| Customer | Everything above, plus check out, pay, review, wishlist, inbox, account | Open any admin page or admin data |
| Admin | Everything in admin, and the customer features | See other people's passwords; payment screenshots are visible to admins only |

## 10. Edge cases the flows handle
| Situation | What happens |
|---|---|
| Two customers want the last bag | The first order wins; the second sees "Only N left" |
| Customer reloads after the order is created but the upload failed | The order stays unpaid; they use **Submit payment proof** on the Orders page |
| Customer pays the wrong amount | Owner rejects with "Incorrect amount"; the customer is told and can resend |
| Customer never pays | The order expires after 24 hours and stock returns |
| Signed in for 30 days | The sign-in expires and the person signs in again |
| Email link used twice or too late | A clear message and a way to ask for a new link |
| Server unreachable | "We could not reach the server" with a Try again button |
