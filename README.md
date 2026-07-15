# Mick Wallet

A mobile-first landing-page prototype for a university campus payments coursework project.

## Phase 1 scope

- Demonstrate the product concept and visual direction
- Present a familiar university sign-in-to-wallet flow
- Make the prototype comfortable on a phone
- Publish as a static site on GitHub Pages

This version **does not create wallets, authenticate users, custody assets, or move funds**.

## Run locally

```bash
python -m http.server 8080
```

Open <http://localhost:8080>.

## GitHub Pages

The repository is a dependency-free static site. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.

## Important security direction for later phases

A public student email should not directly become a wallet private key. A production design should use university OAuth/OIDC only for identity verification, then create or connect wallet credentials using a reviewed key-management model. Never place OAuth client secrets, private keys, or GitHub tokens in this repository or frontend JavaScript.
