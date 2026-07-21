# Campus Wallet

A vendor-neutral, mobile-first reference interface for account-based campus payments. The prototype deliberately avoids university-specific colors, mascots, token names, and wallet-vendor branding so an institution can apply its own design system later.

The current flow is based on `campus_wallet_vendor_neutral_gui(1).pdf` and implements all eight reference states as an interactive static web app.

## Implemented flow

1. **Access** — validate a school email and create or recover a deterministic demo wallet.
2. **Overview** — show the available balance, persistent account context, quick actions, and recent activity.
3. **Receive** — expose a full copyable wallet address, network, and account owner.
4. **Send** — collect a recipient, amount, and optional note while enforcing the available balance.
5. **Review** — provide a locked confirmation checkpoint with a visible zero demo fee.
6. **Processing** — prevent duplicate submission while the simulated transaction runs.
7. **Complete** — show the recipient and transaction reference.
8. **Updated activity** — persist the resulting balance and transaction history locally.

A clearly labelled **Add $100 test funds** action appears in the empty state so the send flow can be exercised without real funds. All values are stored as integer cents.

## Design direction

- Neutral grayscale/slate visual tokens, with no campus branding baked into the UI.
- White cards, restrained borders, soft depth, compact status pills, and a persistent desktop sidebar.
- A fixed app viewport with one intentional content scroller.
- Responsive mobile drawer, safe-area padding, 44px-or-larger interactive controls, and Android visual-viewport sizing.
- Native controls, visible focus states, reduced-motion support, live status feedback, and semantic screen headings.

## Technology

No build step or framework is required:

- semantic HTML
- responsive CSS
- browser-native JavaScript modules
- Web Crypto API for deterministic public demo addresses
- localStorage for demo persistence
- service worker and web app manifest for the PWA shell

## Run and test

```bash
node --test tests/*.test.mjs
python -m http.server 8080
```

Open `http://localhost:8080`. To exercise the full flow:

1. Enter `student@example.edu`.
2. Select **Add $100 test funds**.
3. Open **Send**, use a recipient such as `0x71C492F8`, and enter `25.00`.
4. Review, confirm, and inspect the updated Activity screen.

## Prototype boundaries

This is a front-end product reference, not a production wallet. It does not handle credentials, private keys, real assets, identity-provider integration, settlement, compliance, or live network transactions.
