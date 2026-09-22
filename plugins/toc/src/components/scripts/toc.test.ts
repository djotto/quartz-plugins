import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setActiveSlug, toggleTocState, updateActiveHeading } from "./toc.js";

const heading = (id: string, top: number) =>
  ({ id, getBoundingClientRect: () => ({ top }) }) as HTMLElement;
const link = (slug: string) => {
  const classes = new Set<string>();
  return {
    dataset: { for: slug },
    classList: {
      toggle: (name: string, on: boolean) =>
        on ? classes.add(name) : classes.delete(name),
    },
    classes,
  } as unknown as HTMLAnchorElement & { classes: Set<string> };
};

describe("TOC client state", () => {
  it("tracks the last linked heading above the v4 offset", () => {
    const links = [link("one"), link("two"), link("three")];
    assert.equal(
      updateActiveHeading(
        [heading("one", -20), heading("two", 200), heading("three", 300)],
        links,
      ),
      "one",
    );
    assert.equal(
      updateActiveHeading(
        [heading("one", -20), heading("two", -30), heading("three", 300)],
        links,
      ),
      "two",
    );
  });

  it("toggles only the active link", () => {
    const links = [link("one"), link("two")];
    setActiveSlug(links, "two");
    assert.equal(links[0]?.classes.has("in-view"), false);
    assert.equal(links[1]?.classes.has("in-view"), true);
  });

  it("keeps button and content accessibility state in sync", () => {
    const buttonClasses = new Set<string>();
    const contentClasses = new Set<string>();
    const button = {
      classList: {
        contains: (x: string) => buttonClasses.has(x),
        toggle: (x: string, on: boolean) =>
          on ? buttonClasses.add(x) : buttonClasses.delete(x),
      },
      setAttribute: (k: string, v: string) =>
        ((button as Record<string, string>)[k] = v),
    } as unknown as HTMLElement & Record<string, string>;
    const content = {
      classList: {
        toggle: (x: string, on: boolean) =>
          on ? contentClasses.add(x) : contentClasses.delete(x),
      },
      setAttribute: (k: string, v: string) =>
        ((content as Record<string, string>)[k] = v),
      hidden: false,
    } as unknown as HTMLElement & Record<string, string | boolean>;
    toggleTocState(button, content);
    assert.equal(button["aria-expanded"], "false");
    assert.equal(content.hidden, true);
    assert.equal(contentClasses.has("collapsed"), true);
  });
});
