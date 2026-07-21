const SESSION_KEY = "campus-wallet.reference.session.v1";
const OLD_SESSION_KEYS = ["campus-wallet.demo.session"];
const NETWORK = "Test network";

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isSchoolEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(normalizeEmail(email));
}

export async function deriveDemoAddress(email) {
  const bytes = new TextEncoder().encode(`campus-wallet-reference:${normalizeEmail(email)}`);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  return `0x${Array.from(digest.slice(-20), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function createDemoWallet(email) {
  const normalized = normalizeEmail(email);
  return {
    email: normalized,
    address: await deriveDemoAddress(normalized),
    network: NETWORK,
    balance: 0,
    transactions: [],
  };
}

export function shortenAddress(address) {
  const value = String(address ?? "");
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

export function parseTransferAmount(value) {
  const normalized = String(value ?? "").trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function validateTransfer({ recipient, amount, balanceCents }) {
  const cleanRecipient = String(recipient ?? "").trim();
  if (!cleanRecipient) throw new Error("Enter a recipient wallet address.");
  if (cleanRecipient.length < 6) throw new Error("Enter a complete recipient wallet address.");
  const amountCents = parseTransferAmount(amount);
  if (amountCents === null) throw new Error("Enter an amount with no more than two decimal places.");
  if (amountCents > balanceCents) throw new Error("Amount exceeds the available balance.");
  return { recipient: cleanRecipient, amountCents };
}

function transactionReference(seed) {
  let hash = 0x9e3779b9;
  for (const character of String(seed)) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 2654435761) >>> 0;
  }
  const second = Math.imul(hash ^ 0xa5a5a5a5, 2246822519) >>> 0;
  return `0x${hash.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0").slice(0, 4)}`.toUpperCase().replace("0X", "0x");
}

export function createTransaction({ recipient, amountCents, note = "", now = Date.now() }) {
  return {
    id: transactionReference(`${recipient}:${amountCents}:${now}`),
    type: "sent",
    status: "complete",
    recipient,
    amountCents: -Math.abs(amountCents),
    note: String(note).trim(),
    createdAt: now,
  };
}

function formatMoney(cents, signed = false) {
  const value = Math.abs(cents) / 100;
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  if (!signed || cents === 0) return currency;
  return `${cents > 0 ? "+ " : "− "}${currency}`;
}

function safeWallet(candidate) {
  if (!candidate || !isSchoolEmail(candidate.email) || !/^0x[0-9a-f]{40}$/i.test(candidate.address)) return null;
  return {
    email: normalizeEmail(candidate.email),
    address: candidate.address.toLowerCase(),
    network: NETWORK,
    balance: Number.isSafeInteger(candidate.balance) ? Math.max(0, candidate.balance) : 0,
    transactions: Array.isArray(candidate.transactions) ? candidate.transactions : [],
  };
}

if (typeof document !== "undefined") {
  const state = { wallet: null, route: "overview", pending: null };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const ui = {
    access: $('[data-view="access"]'), wallet: $('[data-view="wallet"]'), accessForm: $("#accessForm"),
    schoolEmail: $("#schoolEmail"), accessError: $("#accessError"), accountEmail: $("#accountEmail"),
    shortAddress: $("#shortAddress"), receiveEmail: $("#receiveEmail"), fullAddress: $("#fullAddress"),
    availableBalance: $("#availableBalance"), sendBalance: $("#sendBalance"), recentActivity: $("#recentActivity"),
    activityList: $("#activityList"), transferForm: $("#transferForm"), recipient: $("#recipient"),
    amount: $("#amount"), note: $("#note"), transferError: $("#transferError"),
    reviewAmount: $("#reviewAmount"), reviewRecipient: $("#reviewRecipient"), confirmTransfer: $("#confirmTransfer"),
    completeAmount: $("#completeAmount"), completeRecipient: $("#completeRecipient"),
    completeTransaction: $("#completeTransaction"), copyAddress: $("#copyAddress"), toast: $("#toast"),
    identityButton: $("#identityButton"), resetDemo: $("#resetDemo"), sidebar: $("#sidebar"),
    scrim: $("#scrim"), mobileMenu: $("#mobileMenu"), appMain: $("#appMain"),
  };

  let toastTimer;
  let processingTimer;

  function notify(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2400);
  }

  function persist() {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(state.wallet)); } catch {}
  }

  function clearStoredWallet() {
    try {
      localStorage.removeItem(SESSION_KEY);
      for (const key of OLD_SESSION_KEYS) localStorage.removeItem(key);
    } catch {}
  }

  function loadWallet() {
    try { return safeWallet(JSON.parse(localStorage.getItem(SESSION_KEY) || "null")); } catch { return null; }
  }

  function setShell(authenticated) {
    ui.access.hidden = authenticated;
    ui.wallet.hidden = !authenticated;
    if (authenticated) renderWallet();
  }

  function closeMenu() {
    ui.sidebar.classList.remove("open");
    ui.scrim.classList.remove("open");
    ui.mobileMenu.setAttribute("aria-expanded", "false");
  }

  function navigate(route) {
    if (!state.wallet) return;
    const allowed = new Set(["overview", "receive", "send", "review", "processing", "complete", "activity"]);
    state.route = allowed.has(route) ? route : "overview";
    $$(".content-view[data-view]").forEach((view) => { view.hidden = view.dataset.view !== state.route; });
    $$(".nav-item[data-route]").forEach((button) => button.classList.toggle("active", button.dataset.route === state.route || (state.route === "review" && button.dataset.route === "send")));
    ui.appMain.scrollTop = 0;
    closeMenu();
    if (["overview", "activity", "receive", "send"].includes(state.route)) history.replaceState(null, "", `#${state.route}`);
  }

  function transactionMarkup(transaction) {
    const incoming = transaction.amountCents >= 0;
    const title = transaction.type === "created" ? "Wallet created" : incoming ? "Received test funds" : transaction.note || "Test-network transfer";
    const subtitle = transaction.type === "created" ? "Account setup" : incoming ? "Campus Faucet" : `To ${shortenAddress(transaction.recipient)}`;
    const icon = incoming ? '<path d="M12 4v15m6-6-6 6-6-6"/>' : '<path d="M7 17 17 7M9 7h8v8"/>';
    const amount = transaction.type === "created" ? "" : formatMoney(transaction.amountCents, true);
    return `<div class="transaction-row"><span class="transaction-icon ${incoming ? "incoming" : ""}"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></span><span><b>${title}</b><small>Today · ${subtitle}</small></span><strong class="${incoming ? "positive" : ""}">${amount}</strong></div>`;
  }

  function activityMarkup(transactions, includeFaucet = true) {
    if (!transactions.length) return `<div class="empty-state"><b>No transactions yet</b><p>Send or receive test funds to begin.</p>${includeFaucet ? '<button class="fund-button" type="button" data-fund-demo>Add $100 test funds</button>' : ""}</div>`;
    return transactions.map(transactionMarkup).join("");
  }

  function bindFundingButtons() {
    $$('[data-fund-demo]').forEach((button) => button.addEventListener("click", fundDemo));
  }

  function renderWallet() {
    if (!state.wallet) return;
    ui.accountEmail.textContent = state.wallet.email;
    ui.receiveEmail.textContent = state.wallet.email;
    ui.shortAddress.textContent = shortenAddress(state.wallet.address);
    ui.fullAddress.textContent = state.wallet.address;
    const balance = formatMoney(state.wallet.balance);
    ui.availableBalance.textContent = balance;
    ui.sendBalance.textContent = `${balance} TEST`;
    const recent = state.wallet.transactions.slice(0, 3);
    ui.recentActivity.innerHTML = activityMarkup(recent);
    ui.activityList.innerHTML = activityMarkup(state.wallet.transactions, false);
    bindFundingButtons();
    navigate(state.route);
  }

  function fundDemo() {
    if (!state.wallet || state.wallet.balance > 0) return;
    const now = Date.now();
    state.wallet.balance = 10000;
    state.wallet.transactions.unshift(
      { id: transactionReference(`fund:${now}`), type: "received", status: "complete", amountCents: 10000, createdAt: now },
      { id: transactionReference(`created:${now}`), type: "created", status: "complete", amountCents: 0, createdAt: now - 1 },
    );
    persist();
    renderWallet();
    notify("$100.00 in test funds added.");
  }

  async function signIn(email) {
    state.wallet = await createDemoWallet(email);
    state.route = "overview";
    persist();
    setShell(true);
  }

  ui.accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = normalizeEmail(ui.schoolEmail.value);
    if (!isSchoolEmail(email)) {
      ui.accessError.textContent = "Enter a valid school email address.";
      ui.schoolEmail.focus();
      return;
    }
    ui.accessError.textContent = "";
    await signIn(email);
  });

  ui.transferForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const transfer = validateTransfer({ recipient: ui.recipient.value, amount: ui.amount.value, balanceCents: state.wallet.balance });
      state.pending = { ...transfer, note: ui.note.value.trim() };
      ui.transferError.textContent = "";
      ui.reviewAmount.textContent = `${formatMoney(transfer.amountCents)} TEST`;
      ui.reviewRecipient.textContent = shortenAddress(transfer.recipient);
      navigate("review");
    } catch (error) {
      ui.transferError.textContent = error.message;
    }
  });

  ui.confirmTransfer.addEventListener("click", () => {
    if (!state.pending || state.route === "processing") return;
    navigate("processing");
    ui.confirmTransfer.disabled = true;
    clearTimeout(processingTimer);
    processingTimer = setTimeout(() => {
      const transaction = createTransaction(state.pending);
      state.wallet.balance -= state.pending.amountCents;
      state.wallet.transactions.unshift(transaction);
      persist();
      ui.completeAmount.textContent = `${formatMoney(state.pending.amountCents)} TEST`;
      ui.completeRecipient.textContent = shortenAddress(state.pending.recipient);
      ui.completeTransaction.textContent = shortenAddress(transaction.id);
      state.pending = null;
      ui.confirmTransfer.disabled = false;
      ui.transferForm.reset();
      renderWallet();
      navigate("complete");
    }, 1050);
  });

  ui.copyAddress.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(state.wallet.address);
      notify("Wallet address copied.");
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ui.fullAddress);
      selection.removeAllRanges();
      selection.addRange(range);
      notify("Address selected — choose Copy.");
    }
  });

  ui.identityButton.addEventListener("click", () => {
    state.wallet = null;
    state.pending = null;
    clearStoredWallet();
    setShell(false);
    ui.schoolEmail.focus();
    notify("Signed out of Campus Wallet.");
  });

  ui.resetDemo.addEventListener("click", () => {
    state.wallet = null;
    state.pending = null;
    clearStoredWallet();
    setShell(false);
    ui.schoolEmail.value = "";
    ui.schoolEmail.focus();
    closeMenu();
  });

  $$('[data-route]').forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(button.dataset.route);
  }));

  ui.mobileMenu.addEventListener("click", () => {
    const open = !ui.sidebar.classList.contains("open");
    ui.sidebar.classList.toggle("open", open);
    ui.scrim.classList.toggle("open", open);
    ui.mobileMenu.setAttribute("aria-expanded", String(open));
  });
  ui.scrim.addEventListener("click", closeMenu);

  function setViewportHeight() {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
  }

  state.wallet = loadWallet();
  state.route = location.hash.slice(1) || "overview";
  setShell(Boolean(state.wallet));
  setViewportHeight();
  window.visualViewport?.addEventListener("resize", setViewportHeight);
  window.addEventListener("resize", setViewportHeight);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
