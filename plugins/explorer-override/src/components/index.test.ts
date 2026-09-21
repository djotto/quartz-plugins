import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { explorerOverrideScript } from "./index.js";

function classList() {
  const values = new Set<string>();
  return {
    add: (...names: string[]) => names.forEach((name) => values.add(name)),
    contains: (name: string) => values.has(name),
    remove: (...names: string[]) =>
      names.forEach((name) => values.delete(name)),
  };
}

test("closes a stale desktop Explorer when entering the mobile breakpoint", () => {
  let onChange: ((event: { matches: boolean }) => void) | undefined;
  const explorerClasses = classList();
  const rootClasses = classList();
  const bodyClasses = classList();
  rootClasses.add("mobile-no-scroll");
  bodyClasses.add("lock-scroll");

  let expanded = "true";
  const explorer = {
    classList: explorerClasses,
    setAttribute(name: string, value: string) {
      if (name === "aria-expanded") expanded = value;
    },
  };

  const mediaQuery = {
    matches: false,
    addEventListener(
      _name: string,
      listener: (event: { matches: boolean }) => void,
    ) {
      onChange = listener;
    },
    removeEventListener() {},
  };

  const stored = new Map<string, string>();
  const context = {
    document: {
      addEventListener() {},
      documentElement: { classList: rootClasses },
      querySelector(selector: string) {
        return selector === "#quartz-body" ? { classList: bodyClasses } : null;
      },
      querySelectorAll(selector: string) {
        return selector === ".explorer" ? [explorer] : [];
      },
    },
    sessionStorage: {
      getItem(key: string) {
        return stored.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        stored.set(key, value);
      },
    },
    window: {
      matchMedia() {
        return mediaQuery;
      },
    },
  };

  vm.runInNewContext(explorerOverrideScript, context);
  assert.equal(explorerClasses.contains("collapsed"), false);
  assert.equal(stored.get("explorerScrollTop"), "0");

  onChange?.({ matches: true });

  assert.equal(explorerClasses.contains("collapsed"), true);
  assert.equal(expanded, "false");
  assert.equal(rootClasses.contains("mobile-no-scroll"), false);
  assert.equal(bodyClasses.contains("lock-scroll"), false);
});
