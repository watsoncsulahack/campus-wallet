import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveDemoAddress,
  isStudentEmail,
  shortenAddress,
} from "../app.mjs";

test("accepts a normal university-style email address", () => {
  assert.equal(isStudentEmail("alex@university.edu"), true);
  assert.equal(isStudentEmail("not-an-email"), false);
});

test("derives the same Ethereum-shaped demo address from normalized email", async () => {
  const first = await deriveDemoAddress(" Alex@University.edu ");
  const second = await deriveDemoAddress("alex@university.edu");
  assert.equal(first, second);
  assert.match(first, /^0x[0-9a-f]{40}$/);
});

test("different emails derive different demo addresses", async () => {
  assert.notEqual(
    await deriveDemoAddress("alex@university.edu"),
    await deriveDemoAddress("jordan@university.edu"),
  );
});

test("shortens an Ethereum address for narrow status pills", () => {
  assert.equal(
    shortenAddress("0x1234567890abcdef1234567890abcdef12345678"),
    "0x1234…5678",
  );
});
