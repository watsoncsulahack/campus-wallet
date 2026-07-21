# Campus Wallet iteration log

## Vendor-neutral reference implementation — 2026-07-21

### Goal

Replace the prematurely branded campus prototype with a vendor-neutral product reference based on the supplied eight-screen GUI flow.

### Behavior changes

- Replaced the branded dashboard/sign-in dialog with a complete access-first wallet flow.
- Added overview, receive, send, review, processing, completion, and activity states.
- Added deterministic account creation, integer-cent balances, local persistence, transfer validation, clipboard support, test funding, and transaction history.
- Added persistent desktop navigation/account context and a mobile navigation drawer.
- Reworked the visual language into institution-independent grayscale/slate tokens and neutral wallet graphics.

### Intentionally deferred

- University theme injection and per-campus design tokens.
- Real identity-provider, wallet-vendor, or payment-network integration.
- Server-side persistence, transaction settlement, compliance, and production security.
- QR code generation and external address validation.

### Files changed

- `index.html`
- `styles.css`
- `app.mjs`
- `icon.svg`
- `manifest.webmanifest`
- `sw.js`
- `README.md`
- `tests/app.test.mjs`
- `tests/layout.test.mjs`

### Verification

- `node --test tests/*.test.mjs`
- Static server smoke test and HTTP asset checks.
- Responsive browser screenshots at phone and desktop dimensions.

### Feedback checklist

1. On a phone, does the access page feel spacious and immediately understandable?
2. After sign-in, are balance, Send, Receive, and Activity easy to find without explanation?
3. Does the mobile drawer feel natural and stay out of the way?
4. Does the neutral visual system feel adaptable rather than unfinished?
5. Is the transfer review checkpoint clear enough before confirmation?
