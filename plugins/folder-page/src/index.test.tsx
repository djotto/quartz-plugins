import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type {
  QuartzComponentProps,
  QuartzPluginData,
} from "@quartz-community/types";
import {
  FolderPage,
  listPageStyle,
  mergeIncludedPages,
  normalizeIncludeTags,
  OttonPageList,
  pagesFromAllFiles,
} from "./index.js";

type PageEntry = QuartzPluginData & Record<string, unknown>;

const emptyTree = { type: "root", children: [] };
const alphaSort = (a: QuartzPluginData, b: QuartzPluginData) =>
  (a.frontmatter?.title ?? "").localeCompare(b.frontmatter?.title ?? "");

function page(
  slug: string,
  options: {
    title?: string;
    tags?: string[];
    description?: string;
    date?: string;
    unlisted?: boolean;
  } = {},
): PageEntry {
  const result: PageEntry = {
    slug: slug as QuartzPluginData["slug"],
    frontmatter: {
      title: options.title ?? slug,
      tags: options.tags ?? [],
      ...(options.description ? { description: options.description } : {}),
    },
  };
  if (options.date) {
    const date = new Date(options.date);
    result.defaultDateType = "created";
    result.dates = { created: date, modified: date, published: date };
  }
  if (options.unlisted !== undefined) result.unlisted = options.unlisted;
  return result;
}

function componentProps(
  fileData: PageEntry,
  allFiles: PageEntry[],
): QuartzComponentProps {
  return {
    ctx: {},
    externalResources: { css: [], js: [], additionalHead: [] },
    fileData,
    cfg: { locale: "en-GB" },
    children: [],
    tree: emptyTree,
    allFiles,
  } as unknown as QuartzComponentProps;
}

describe("folder includes", () => {
  test("normalizes scalar, array, comma-separated, and duplicate tags", () => {
    assert.deepEqual(normalizeIncludeTags("Coach and Horses, HILSEA"), [
      "coach-and-horses",
      "hilsea",
    ]);
    assert.deepEqual(
      normalizeIncludeTags(["Hilsea", " Battle of Minden,hilsea ", null]),
      ["hilsea", "battle-of-minden"],
    );
  });

  test("adds matching listed pages once and excludes current and already-listed pages", () => {
    const direct = page("places/direct", { tags: ["Hilsea"] });
    const current = page("places/index", { tags: ["Hilsea"] });
    const included = page("sources/included", { tags: ["Coach and Horses"] });
    const unlisted = page("sources/private", {
      tags: ["coach-and-horses"],
      unlisted: true,
    });
    const unrelated = page("sources/other", { tags: ["Portsmouth"] });

    const result = mergeIncludedPages(
      [direct],
      [current, direct, included, included, unlisted, unrelated],
      "places/index",
      ["coach-and-horses", "Hilsea"],
    );

    assert.deepEqual(
      result.map((entry) => entry.slug),
      ["places/direct", "sources/included"],
    );
  });

  test("finds direct children, explicit indexes, and synthetic subfolders without unlisted pages", () => {
    const result = pagesFromAllFiles(
      [
        page("notes/direct"),
        page("notes/private", { unlisted: true }),
        page("notes/index"),
        page("notes/with-index/index", { title: "Named folder" }),
        page("notes/with-index/child"),
        page("notes/synthetic/child", { date: "2026-02-01T00:00:00Z" }),
      ],
      "notes/index",
      true,
    );

    assert.deepEqual(result.map((entry) => entry.slug).sort(), [
      "notes/direct",
      "notes/synthetic/index",
      "notes/with-index/index",
    ]);
  });
});

describe("OttonPageList", () => {
  test("renders Markdown frontmatter descriptions beneath titles", () => {
    const listing = page("notes/index");
    const child = page("notes/child", {
      title: "Child",
      description: "A **bold** description with [a link](https://example.com).",
    });
    const html = renderToString(
      h(OttonPageList as never, {
        ...componentProps(listing, [child]),
        sort: alphaSort,
      }),
    );

    assert.match(html, /class="description"/);
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /href="https:\/\/example\.com"/);
    assert.ok(html.indexOf("Child") < html.indexOf('class="description"'));
  });

  test("ships the v4 two-column description layout", () => {
    assert.match(
      listPageStyle,
      /grid-template-columns: fit-content\(8em\) minmax\(0, 1fr\)/,
    );
    assert.match(listPageStyle, /> \.description/);
    assert.match(listPageStyle, /grid-row: 2/);
  });
});

test("FolderPage renders month/year dates", () => {
  const current = page("notes/index");
  const child = page("notes/dated", {
    title: "Dated",
    date: "2026-01-18T00:00:00Z",
  });
  const plugin = FolderPage();
  const Component = plugin.body();
  const html = renderToString(
    h(Component as never, componentProps(current, [current, child])),
  );

  assert.match(html, /Jan 2026/);
  assert.doesNotMatch(html, /18 Jan 2026/);
});

test("synthetic year folders show the latest listed child's creation month", () => {
  const current = page("daily-notes/index");
  const older = page("daily-notes/2007/2007-09-12", {
    date: "2007-09-12T00:00:00Z",
  });
  const latest = page("daily-notes/2007/2007-12-17", {
    date: "2007-12-17T00:00:00Z",
  });
  latest.dates!.modified = new Date("2026-09-01T00:00:00Z");
  const unlisted = page("daily-notes/2007/2008-01-01", {
    date: "2008-01-01T00:00:00Z",
    unlisted: true,
  });
  const allFiles = [current, older, latest, unlisted];

  const fallbackPages = pagesFromAllFiles(allFiles, current.slug!, true);
  const year = fallbackPages.find(
    (entry) => entry.frontmatter?.title === "2007",
  );
  assert.equal(year?.defaultDateType, "created");
  assert.equal(year?.dates?.created.toISOString(), "2007-12-17T00:00:00.000Z");

  const Component = FolderPage().body();
  const fallbackHtml = renderToString(
    h(Component as never, componentProps(current, allFiles)),
  );
  assert.match(fallbackHtml, /<time[^>]*>Dec 2007<\/time>[\s\S]*?>2007<\/a>/);
  assert.doesNotMatch(fallbackHtml, /Sep 2026|Jan 2008/);

  const trieProps = componentProps(current, allFiles);
  (trieProps.ctx as { trie?: unknown }).trie = {
    findNode: () => ({
      children: [
        {
          isFolder: true,
          slug: "daily-notes/2007/index",
          displayName: "2007",
          data: null,
          children: [older, latest, unlisted].map((data) => ({ data })),
        },
      ],
    }),
  };
  const trieHtml = renderToString(h(Component as never, trieProps));
  assert.match(trieHtml, /<time[^>]*>Dec 2007<\/time>[\s\S]*?>2007<\/a>/);
});
