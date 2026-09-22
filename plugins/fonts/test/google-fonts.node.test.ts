import assert from "node:assert/strict";
import test from "node:test";
import { formatFontSpecification, googleFontHref } from "../src/util/google-fonts";

test("formats a single body weight with normal and italic variants", () => {
  assert.equal(
    formatFontSpecification("body", {
      name: "IM Fell English",
      weights: [400],
      includeItalic: true,
    }),
    "IM Fell English:ital,wght@0,400;1,400",
  );
});

test("includes a single weight when formatting merged Google Fonts entries", () => {
  assert.equal(
    googleFontHref({
      title: {
        name: "IM Fell English SC",
        weights: [400],
        includeItalic: false,
      },
      header: {
        name: "IM Fell English SC",
        weights: [400],
        includeItalic: false,
      },
      body: {
        name: "IM Fell English",
        weights: [400],
        includeItalic: true,
      },
      code: {
        name: "IBM Plex Mono",
        weights: [400, 600],
        includeItalic: false,
      },
    }),
    "https://fonts.googleapis.com/css2?family=IM%20Fell%20English%20SC%3Awght%40400&family=IM%20Fell%20English%3Aital%2Cwght%400%2C400%3B1%2C400&family=IBM%20Plex%20Mono%3Awght%40400%3B600&display=swap",
  );
});
