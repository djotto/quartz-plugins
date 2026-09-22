import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { h } from "preact";
import renderToString from "preact-render-to-string";

import { ContentMeta } from "./index.js";

function renderContentMeta({
  created,
  modified,
  text = "one two three",
}: {
  created?: Date;
  modified?: Date;
  text?: string;
}) {
  const Component = ContentMeta({ showReadingTime: false });
  return renderToString(
    h(Component as never, {
      cfg: { locale: "en-GB" },
      fileData: {
        text,
        dates: {
          ...(created ? { created } : {}),
          ...(modified ? { modified } : {}),
        } as never,
      },
    }),
  );
}

describe("ContentMeta", () => {
  test("renders created month and year", () => {
    const html = renderContentMeta({
      created: new Date("2026-01-18T00:00:00Z"),
    });

    assert.match(html, /Created/);
    assert.match(html, /Jan 2026/);
  });

  test("renders last updated when modified month differs from created", () => {
    const html = renderContentMeta({
      created: new Date("2026-01-18T00:00:00Z"),
      modified: new Date("2026-02-03T00:00:00Z"),
    });

    assert.match(html, /Created/);
    assert.match(html, /Jan 2026/);
    assert.match(html, /Last updated/);
    assert.match(html, /Feb 2026/);
  });

  test("omits last updated when modified is in the same month as created", () => {
    const html = renderContentMeta({
      created: new Date("2026-01-18T00:00:00Z"),
      modified: new Date("2026-01-31T00:00:00Z"),
    });

    assert.match(html, /Created/);
    assert.doesNotMatch(html, /Last updated/);
  });
});
