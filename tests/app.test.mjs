import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoWallet,
  createTransaction,
  deriveDemoAddress,
  isSchoolEmail,
  normalizeEmail,
  parseTransferAmount,
  shortenAddress,
  validateTransfer,
} from "../app.mjs";

test("normalizes and validates school-style email addresses", () => {
  assert.equal(normalizeEmail(" Student@Example.EDU "), "student@example.edu");
  assert.equal(isSchoolEmail("student@example.edu"), true);
  assert.equal(isSchoolEmail("not-an-email"), false);
});

test("derives the same demo address for equivalent identities", async () => {
  const first = await deriveDemoAddress("Student@Example.edu");
  const second = await deriveDemoAddress(" student@example.edu ");
  assert.match(first, /^0x[0-9a-f]{40}$/);
  assert.equal(first, second);
});

test("creates a zero-balance account-based wallet", async () => {
  const wallet = await createDemoWallet("student@example.edu");
  assert.equal(wallet.email, "student@example.edu");
  assert.equal(wallet.network, "Test network");
  assert.equal(wallet.balance, 0);
  assert.deepEqual(wallet.transactions, []);
});

test("parses currency amounts without floating-point storage", () => {
  assert.equal(parseTransferAmount("25"), 2500);
  assert.equal(parseTransferAmount("25.40"), 2540);
  assert.equal(parseTransferAmount("0.009"), null);
  assert.equal(parseTransferAmount("abc"), null);
});

test("validates recipient, amount, and available balance", () => {
  const valid = validateTransfer({ recipient: "0x71c492f8", amount: "25.00", balanceCents: 10000 });
  assert.deepEqual(valid, { recipient: "0x71c492f8", amountCents: 2500 });
  assert.throws(() => validateTransfer({ recipient: "", amount: "25", balanceCents: 10000 }), /recipient/i);
  assert.throws(() => validateTransfer({ recipient: "0x71c492f8", amount: "125", balanceCents: 10000 }), /available balance/i);
});

test("creates traceable completed demo transactions", () => {
  const transaction = createTransaction({
    recipient: "0x71c492f8",
    amountCents: 2500,
    note: "Shared project expense",
    now: 1721520000000,
  });
  assert.equal(transaction.status, "complete");
  assert.equal(transaction.amountCents, -2500);
  assert.match(transaction.id, /^0x[0-9A-F]{12}$/);
});

test("shortens wallet addresses without losing context", () => {
  assert.equal(shortenAddress("0x1234567890abcdef1234567890abcdef12345678"), "0x1234…5678");
});
