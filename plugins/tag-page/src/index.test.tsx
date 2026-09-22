import assert from "node:assert/strict";
import test from "node:test";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type {
  QuartzComponentProps,
  QuartzPluginData,
} from "@quartz-community/types";
import { TagPage } from "./index.js";

type PageEntry = QuartzPluginData & Record<string, unknown>;

function page(
  slug: string,
  options: { tags?: string[]; description?: string; unlisted?: boolean } = {},
): PageEntry {
  const date = new Date("2026-01-18T00:00:00Z");
  return {
    slug: slug as QuartzPluginData["slug"],
    defaultDateType: "created",
    dates: { created: date, modified: date, published: date },
    frontmatter: {
      title: slug,
      tags: options.tags ?? [],
      ...(options.description ? { description: options.description } : {}),
    },
    ...(options.unlisted === undefined ? {} : { unlisted: options.unlisted }),
  };
}

test("TagPage keeps the full upstream date while rendering descriptions and filtering unlisted pages", () => {
  const current = page("tags/hilsea");
  const visible = page("notes/visible", {
    tags: ["Hilsea"],
    description: "A *visible* description.",
  });
  const hidden = page("notes/hidden", {
    tags: ["hilsea"],
    description: "Secret description.",
    unlisted: true,
  });
  const props = {
    ctx: {},
    externalResources: { css: [], js: [], additionalHead: [] },
    fileData: current,
    cfg: { locale: "en-GB" },
    children: [],
    tree: { type: "root", children: [] },
    allFiles: [current, visible, hidden],
  } as unknown as QuartzComponentProps;
  const Component = TagPage().body();
  const html = renderToString(h(Component as never, props));

  assert.match(html, /18 Jan 2026/);
  assert.match(html, /<em>visible<\/em>/);
  assert.doesNotMatch(html, /Secret description/);
});

test("TagPage renders Markdown descriptions for tag entries on the index", () => {
  const current = page("tags");
  const tagPage = page("tags/hilsea", {
    description: "A **bold** tag description.",
  });
  const tagged = page("notes/visible", { tags: ["hilsea"] });
  const props = {
    ctx: {},
    externalResources: { css: [], js: [], additionalHead: [] },
    fileData: current,
    cfg: { locale: "en-GB" },
    children: [],
    tree: { type: "root", children: [] },
    allFiles: [current, tagPage, tagged],
  } as unknown as QuartzComponentProps;

  const Component = TagPage().body();
  const html = renderToString(h(Component as never, props));

  assert.match(html, /<strong>bold<\/strong>/);
});
