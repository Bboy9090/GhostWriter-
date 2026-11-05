import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("public PWA surfaces use Word Bench branding and asset names", () => {
  const manifest = readFileSync("public/manifest.webmanifest", "utf8");
  const serviceWorker = readFileSync("public/sw.js", "utf8");
  const index = readFileSync("index.html", "utf8");
  const portal = readFileSync("portal.html", "utf8");

  for (const source of [manifest, serviceWorker, index]) {
    assert.doesNotMatch(source, /ghostwriter-icon\.svg/i);
  }
  assert.match(manifest, /word-bench-icon\.svg/);
  assert.match(manifest, /word-bench-maskable\.svg/);
  assert.match(serviceWorker, /word-bench-shell-v1/);
  assert.match(portal, /Bobby's Word Bench Portal/);
  assert.doesNotMatch(portal, /GhostWriter Portal/);
});

test("Word Bench icon aliases preserve the existing approved bytes for now", () => {
  assert.equal(
    readFileSync("public/word-bench-icon.svg", "utf8"),
    readFileSync("public/ghostwriter-icon.svg", "utf8"),
  );
  assert.equal(
    readFileSync("public/word-bench-maskable.svg", "utf8"),
    readFileSync("public/ghostwriter-maskable.svg", "utf8"),
  );
});
