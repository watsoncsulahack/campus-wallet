const WALLET_DEMO_ADDRESS = "0x71c7656ec7ab88b098defb751b7401b5f6d8976f";
const SESSION_KEY = "campus-wallet.demo.session";
const LEGACY_SESSION_KEY = "mick.demo.session";
const state = { identity: null, address: null, balanceVisible: true };

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function isStudentEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(normalizeEmail(email));
}

export async function deriveDemoAddress(email) {
  const bytes = new TextEncoder().encode(`campus-wallet-demo:${normalizeEmail(email)}`);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  return `0x${Array.from(digest.slice(-20), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function shortenAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function setViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
}

if (typeof document !== "undefined") {
  const ui = {
    loginButton: document.querySelector("#loginButton"),
    loginLabel: document.querySelector("#loginLabel"),
    dialog: document.querySelector("#loginDialog"),
    closeLogin: document.querySelector("#closeLogin"),
    form: document.querySelector("#loginForm"),
    email: document.querySelector("#studentEmail"),
    error: document.querySelector("#emailError"),
    walletLogin: document.querySelector("#walletLogin"),
    subtitle: document.querySelector("#accountSubtitle"),
    toast: document.querySelector("#toast"),
    balance: document.querySelector("#balance"),
    balanceToggle: document.querySelector("#balanceToggle"),
  };

  let toastTimer;
  const notify = (message) => {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2600);
  };

  const renderIdentity = () => {
    const signedIn = Boolean(state.identity && state.address);
    ui.loginButton.classList.toggle("connected", signedIn);
    ui.loginLabel.textContent = signedIn
      ? state.identity.type === "email"
        ? state.identity.label
        : shortenAddress(state.address)
      : "Sign in";
    ui.subtitle.textContent = signedIn
      ? "Your campus wallet is ready for Shark Tokens and campus payments."
      : "Campus spending, mascot money, and rewards in one place.";
  };

  const saveSession = (identity, address) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ identity, address }));
      localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {}
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {}
  };

  const signIn = (identity, address) => {
    state.identity = identity;
    state.address = address;
    saveSession(identity, address);
    renderIdentity();
    ui.dialog.close();
    notify(identity.type === "email" ? "Campus Wallet is ready." : "Demo wallet connected.");
  };

  ui.loginButton.addEventListener("click", () => {
    if (state.identity) {
      state.identity = null;
      state.address = null;
      clearSession();
      renderIdentity();
      notify("Signed out of Campus Wallet.");
      return;
    }
    ui.error.textContent = "";
    ui.dialog.showModal();
    requestAnimationFrame(() => ui.email.focus());
  });

  ui.closeLogin.addEventListener("click", () => ui.dialog.close());

  ui.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = normalizeEmail(ui.email.value);
    if (!isStudentEmail(email)) {
      ui.error.textContent = "Enter a valid student email address.";
      return;
    }
    ui.error.textContent = "";
    signIn({ type: "email", label: email }, await deriveDemoAddress(email));
  });

  ui.walletLogin.addEventListener("click", () =>
    signIn({ type: "wallet", label: "External wallet" }, WALLET_DEMO_ADDRESS),
  );

  ui.balanceToggle.addEventListener("click", () => {
    state.balanceVisible = !state.balanceVisible;
    ui.balance.textContent = state.balanceVisible ? "$184.20" : "••••••";
    ui.balanceToggle.textContent = state.balanceVisible ? "◉" : "○";
    ui.balanceToggle.setAttribute(
      "aria-label",
      state.balanceVisible ? "Hide balance" : "Show balance",
    );
  });

  document.querySelectorAll("[data-action]").forEach((button) =>
    button.addEventListener("click", () =>
      notify(`${button.dataset.action} is visual-only in this sprint.`),
    ),
  );

  try {
    const stored = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
    const saved = JSON.parse(stored || "null");
    if (saved?.identity && /^0x[0-9a-f]{40}$/.test(saved.address)) {
      state.identity = saved.identity;
      state.address = saved.address;
      saveSession(saved.identity, saved.address);
    }
  } catch {}

  renderIdentity();
  setViewportHeight();
  window.visualViewport?.addEventListener("resize", setViewportHeight);
  window.addEventListener("resize", setViewportHeight);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
