import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("shell exposes the complete vendor-neutral wallet flow", () => {
  for (const view of ["access", "overview", "receive", "send", "review", "processing", "complete", "activity"]) {
    assert.match(html, new RegExp(`data-view="${view}"`));
  }
});

test("copy and transfer controls are accessible native controls", () => {
  assert.match(html, /id="copyAddress"[^>]*type="button"/);
  assert.match(html, /id="transferForm"/);
  assert.match(html, /id="confirmTransfer"[^>]*type="button"/);
  assert.match(html, /aria-live="polite"/);
});

test("brand language and UI remain vendor-neutral", () => {
  assert.match(html, /Vendor-neutral reference/);
  assert.match(html, /Test network/);
  assert.doesNotMatch(html, /CSULB|CSUB|Shark|Beach wallet|mascot money/i);
  assert.doesNotMatch(css, /--gold|--navy|--sea|--coral/i);
});

test("mobile layout provides a single intentional content scroller and touch targets", () => {
  assert.match(css, /\.app-main\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /100dvh/);
});

test("desktop shell uses persistent account context and sidebar navigation", () => {
  assert.match(html, /class="account-context"/);
  assert.match(html, /class="sidebar"/);
  assert.match(html, /data-route="overview"/);
  assert.match(html, /data-route="activity"/);
});
