import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { samePageAnchor, focusAnchor } = loadTypeScript("lib/motion/anchor-navigation.ts");
const current = "https://apar.example/work/signi?preview=1";

test("anchor navigation preserves encoded IDs and stays within the current document", () => {
  assert.deepEqual(samePageAnchor("#case-work", current), { hash: "#case-work", id: "case-work" });
  assert.deepEqual(samePageAnchor("#client%20words", current), { hash: "#client%20words", id: "client words" });
  for (const href of ["/work", "/work/signi#case-work", "?preview=2#case-work", "https://other.example/#case-work", "#", "#%zz", "mailto:hello@example.com"]) {
    assert.equal(samePageAnchor(href, current), null, href);
  }
});

function focusTarget(tabIndex = -1, explicit = false) {
  const attributes = new Map(explicit ? [["tabindex", String(tabIndex)]] : []);
  const listeners = new Map();
  return {
    tabIndex, attributes, listeners, focused: false,
    hasAttribute: name => attributes.has(name),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
    addEventListener: (name, handler) => listeners.set(name, handler),
    focus(options) { this.focused = options.preventScroll; },
  };
}

test("section navigation transfers focus without a second scroll or a lasting tab stop", () => {
  const section = focusTarget();
  focusAnchor(section);
  assert.equal(section.focused, true);
  assert.equal(section.attributes.get("tabindex"), "-1");
  section.listeners.get("blur")();
  assert.equal(section.attributes.has("tabindex"), false);
});

test("anchor focus preserves existing keyboard semantics", () => {
  for (const target of [focusTarget(0), focusTarget(-1, true), focusTarget(0, true)]) {
    const before = [...target.attributes];
    focusAnchor(target);
    assert.equal(target.focused, true);
    assert.deepEqual([...target.attributes], before);
    assert.equal(target.listeners.size, 0);
  }
});
