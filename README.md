# Campus Wallet

A one-viewport, mobile-first campus payments and mascot-money prototype. Each participating campus can apply its own identity and issue branded digital value; this CSUB-flavored demo uses **Shark Tokens**.

## Current demo behavior

- **Student email:** entering a valid email signs in and derives a deterministic, Ethereum-shaped **public demo address** with the browser Web Crypto API.
- **Connect a wallet:** closes the sign-in dialog and uses a fixed Ethereum-shaped placeholder address.
- **Signed-in state:** the top-right control turns green and displays the email or shortened address. Tap it again to sign out.
- **Dummy wallet data:** the balance, Shark Tokens, Campus USD, meal credits, and activity are visual prototype data.
- **PWA shell:** includes a web app manifest, service worker, standalone display mode, safe-area support, and visual-viewport sizing.
- **Responsive layout:** adapts between portrait phones, short landscape screens, tablets, desktops, and foldable-width displays without document scrolling.

## Technology

This project does **not** use Svelte, React, or another framework. It is intentionally dependency-free:

- semantic HTML
- responsive CSS Grid
- JavaScript ES modules
- Web Crypto (`SHA-256`) for demo-address derivation
- Service Worker + Web App Manifest for the PWA shell

GitHub Pages can host every file directly.

## Run and test locally

```bash
node --test tests/app.test.mjs
python -m http.server 8080
```

Open <http://localhost:8080>.

## Security boundary

The generated address is a visual demonstration only. It is produced from a public email plus a fixed namespace and therefore **must never be treated as a private key, seed phrase, ownership proof, or secure wallet**. A real implementation should authenticate through university OAuth/OIDC and then create, connect, or recover wallet credentials through a reviewed key-management design.

Never place OAuth client secrets, wallet keys, seed phrases, or GitHub tokens in frontend code or this repository.
