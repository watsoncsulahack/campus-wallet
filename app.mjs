const WALLET_DEMO_ADDRESS = "0x71c7656ec7ab88b098defb751b7401b5f6d8976f";
const state = { identity: null, address: null, balanceVisible: true };

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function isStudentEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(normalizeEmail(email));
}

export async function deriveDemoAddress(email) {
  const bytes = new TextEncoder().encode(`mick-wallet-demo:${normalizeEmail(email)}`);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  return `0x${Array.from(digest.slice(-20), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function shortenAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function initials(value) {
  const first = value.split("@")[0].replace(/[^a-z0-9]+/gi, " ").trim();
  return first.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "ST";
}

function setViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
}

if (typeof document !== "undefined") {
  const ui = {
    loginButton: document.querySelector("#loginButton"), loginLabel: document.querySelector("#loginLabel"), dialog: document.querySelector("#loginDialog"),
    form: document.querySelector("#loginForm"), email: document.querySelector("#studentEmail"), error: document.querySelector("#emailError"), walletLogin: document.querySelector("#walletLogin"),
    identityName: document.querySelector("#identityName"), identityDetail: document.querySelector("#identityDetail"), avatar: document.querySelector("#avatar"), subtitle: document.querySelector("#accountSubtitle"),
    addressText: document.querySelector("#addressText"), copyAddress: document.querySelector("#copyAddress"), toast: document.querySelector("#toast"), balance: document.querySelector("#balance"), balanceToggle: document.querySelector("#balanceToggle"),
  };
  let toastTimer;
  const notify = (message) => {
    ui.toast.textContent = message; ui.toast.classList.add("show"); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2600);
  };
  const renderIdentity = () => {
    const signedIn = Boolean(state.identity && state.address);
    ui.loginButton.classList.toggle("connected", signedIn);
    ui.loginLabel.textContent = signedIn ? (state.identity.type === "email" ? state.identity.label : shortenAddress(state.address)) : "Sign in";
    ui.identityName.textContent = signedIn ? (state.identity.type === "email" ? state.identity.label : "Connected wallet") : "Not signed in";
    ui.identityDetail.textContent = signedIn ? (state.identity.type === "email" ? "Student email" : "External wallet demo") : "University identity";
    ui.avatar.textContent = signedIn ? (state.identity.type === "email" ? initials(state.identity.label) : "◇") : "ST";
    ui.addressText.textContent = signedIn ? shortenAddress(state.address) : "Connect to generate";
    ui.copyAddress.disabled = !signedIn;
    ui.subtitle.textContent = signedIn ? "Your campus wallet is ready for this visual demo." : "Sign in with your student email to activate this demo wallet.";
  };
  const signIn = (identity, address) => {
    state.identity = identity; state.address = address; renderIdentity(); ui.dialog.close();
    try { localStorage.setItem("mick.demo.session", JSON.stringify({ identity, address })); } catch {}
    notify(identity.type === "email" ? "Student demo wallet ready." : "Demo wallet connected.");
  };
  ui.loginButton.addEventListener("click", () => {
    if (state.identity) {
      state.identity = null; state.address = null;
      try { localStorage.removeItem("mick.demo.session"); } catch {}
      renderIdentity(); notify("Signed out of the demo."); return;
    }
    ui.error.textContent = ""; ui.dialog.showModal(); requestAnimationFrame(() => ui.email.focus());
  });
  ui.form.addEventListener("submit", async (event) => {
    event.preventDefault(); const email = normalizeEmail(ui.email.value);
    if (!isStudentEmail(email)) { ui.error.textContent = "Enter a valid student email address."; return; }
    ui.error.textContent = ""; signIn({ type: "email", label: email }, await deriveDemoAddress(email));
  });
  ui.walletLogin.addEventListener("click", () => signIn({ type: "wallet", label: "External wallet" }, WALLET_DEMO_ADDRESS));
  ui.copyAddress.addEventListener("click", async () => {
    if (!state.address) return;
    try { await navigator.clipboard.writeText(state.address); notify("Demo address copied."); } catch { notify(state.address); }
  });
  ui.balanceToggle.addEventListener("click", () => {
    state.balanceVisible = !state.balanceVisible; ui.balance.textContent = state.balanceVisible ? "$184.20" : "••••••";
    ui.balanceToggle.textContent = state.balanceVisible ? "◉" : "○"; ui.balanceToggle.setAttribute("aria-label", state.balanceVisible ? "Hide balance" : "Show balance");
  });
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => notify(`${button.dataset.action} is visual-only in this sprint.`)));
  try {
    const saved = JSON.parse(localStorage.getItem("mick.demo.session") || "null");
    if (saved?.identity && /^0x[0-9a-f]{40}$/.test(saved.address)) { state.identity = saved.identity; state.address = saved.address; }
  } catch {}
  renderIdentity(); setViewportHeight();
  window.visualViewport?.addEventListener("resize", setViewportHeight); window.addEventListener("resize", setViewportHeight);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
