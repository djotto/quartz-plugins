import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { describe } from "node:test";
import type { Root } from "hast";
import { VFile } from "vfile";
import type {
  BuildCtx,
  FullSlug,
  ProcessedContent,
} from "@quartz-community/types";
import { OttonContentIndex } from "./index.js";

const paragraphTree = (text: string): Root => ({
  type: "root",
  children: [
    {
      type: "element",
      tagName: "p",
      properties: {},
      children: [
        { type: "text", value: text },
        {
          type: "element",
          tagName: "a",
          properties: { href: "../linked-note" },
          children: [{ type: "text", value: "Linked note" }],
        },
        {
          type: "element",
          tagName: "img",
          properties: {
            src: "assets/image.jpg",
            srcSet: "assets/image-small.jpg 1x, assets/image-large.jpg 2x",
          },
          children: [],
        },
      ],
    },
  ],
});

function processedContent({
  slug,
  relativePath,
  title,
  text,
  date,
  modifiedDate = date,
  encrypted = false,
}: {
  slug: string;
  relativePath: string;
  title: string;
  text: string;
  date: string;
  modifiedDate?: string;
  encrypted?: boolean;
}): ProcessedContent {
  const file = new VFile();
  Object.assign(file.data, {
    slug,
    relativePath,
    filePath: `content/${relativePath}`,
    frontmatter: { title },
    text,
    description: `${title} description`,
    links: [],
    encrypted,
    defaultDateType: "created",
    dates: {
      created: new Date(date),
      modified: new Date(modifiedDate),
      published: new Date(date),
    },
  });
  return [paragraphTree(text), file] as ProcessedContent;
}

describe("ContentIndex Daily Notes RSS", () => {
  test("emits configured rich HTML in the JSON index except for encrypted pages", async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), "otton-content-index-rich-content-"),
    );

    try {
      const plugin = OttonContentIndex({
        enableSiteMap: false,
        enableRSS: false,
        rssFullHtml: true,
        fields: {
          slug: { source: "data.slug" },
          richContent: { source: "computed.richContent" },
        },
      });
      const ctx = {
        argv: { output },
        cfg: {
          configuration: {
            pageTitle: "Work In Progress",
            baseUrl: "otton.org",
          },
        },
      } as BuildCtx;
      const content = [
        processedContent({
          slug: "public-note",
          relativePath: "Public note.md",
          title: "Public note",
          text: "Public body",
          date: "2025-01-01T00:00:00Z",
        }),
        processedContent({
          slug: "encrypted-note",
          relativePath: "Encrypted note.md",
          title: "Encrypted note",
          text: "Encrypted body",
          date: "2025-01-02T00:00:00Z",
          encrypted: true,
        }),
      ];

      await plugin.emit(ctx, content, { css: [], js: [], additionalHead: [] });

      const index = JSON.parse(
        await readFile(
          path.join(output, "static", "contentIndex.json"),
          "utf8",
        ),
      ) as Record<string, Record<string, unknown>>;
      assert.match(
        String(index["public-note"].richContent),
        /^&lt;p&gt;Public body/,
      );
      assert.match(
        String(index["public-note"].richContent),
        /href=&quot;\.\.\/linked-note&quot;/,
      );
      assert.equal("richContent" in index["encrypted-note"], false);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  test("filters RSS without filtering the sitemap or JSON index", async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), "otton-content-index-"),
    );

    try {
      const plugin = OttonContentIndex({
        enableSiteMap: true,
        enableRSS: true,
        rssLimit: 50,
        rssFullHtml: true,
        rssSlug: "index",
        rssFolder: "content/Daily Notes",
        rssIncludeEmptyFiles: false,
        rssGuid: "file-basename-hash",
        includeEmptyFiles: true,
        fields: {
          slug: { source: "data.slug" },
        },
      });
      const ctx = {
        argv: { output },
        cfg: {
          configuration: {
            pageTitle: "Work In Progress",
            baseUrl: "otton.org",
            locale: "en-GB",
          },
        },
      } as BuildCtx;
      const content = [
        processedContent({
          slug: "daily-notes/2025/2025-01-02",
          relativePath: "Daily notes/2025/2025-01-02.md",
          title: "Daily entry",
          text: "Daily body",
          date: "2025-01-02T00:00:00Z",
          modifiedDate: "2026-08-14T12:34:56Z",
        }),
        processedContent({
          slug: "daily-notes/2025/2025-01-01",
          relativePath: "Daily notes/2025/2025-01-01.md",
          title: "Empty daily entry",
          text: "",
          date: "2025-01-01T00:00:00Z",
        }),
        processedContent({
          slug: "technology/outside-note",
          relativePath: "Technology/Outside note.md",
          title: "Outside note",
          text: "Outside body",
          date: "2025-01-03T00:00:00Z",
        }),
      ];

      await plugin.emit(ctx, content, { css: [], js: [], additionalHead: [] });

      const rss = await readFile(path.join(output, "index.xml"), "utf8");
      assert.match(rss, /<title>Daily entry<\/title>/);
      assert.match(rss, /<pubDate>Thu, 02 Jan 2025 00:00:00 GMT<\/pubDate>/);
      assert.doesNotMatch(rss, /Empty daily entry/);
      assert.doesNotMatch(rss, /Outside note/);
      assert.match(rss, /<description><!\[CDATA\[ <p>Daily body/);
      assert.match(
        rss,
        /href="https:\/\/otton\.org\/daily-notes\/linked-note"/,
      );
      assert.match(
        rss,
        /src="https:\/\/otton\.org\/daily-notes\/2025\/assets\/image\.jpg"/,
      );
      assert.match(
        rss,
        /srcset="https:\/\/otton\.org\/daily-notes\/2025\/assets\/image-small\.jpg 1x, https:\/\/otton\.org\/daily-notes\/2025\/assets\/image-large\.jpg 2x"/,
      );

      const expectedGuid = createHash("sha256")
        .update("2025-01-02.md")
        .digest("hex");
      assert.match(
        rss,
        new RegExp(`<guid isPermaLink="false">${expectedGuid}</guid>`),
      );

      const index = JSON.parse(
        await readFile(
          path.join(output, "static", "contentIndex.json"),
          "utf8",
        ),
      ) as Record<string, unknown>;
      assert.deepEqual(Object.keys(index).sort(), [
        "daily-notes/2025/2025-01-01",
        "daily-notes/2025/2025-01-02",
        "technology/outside-note",
      ]);

      const sitemap = await readFile(path.join(output, "sitemap.xml"), "utf8");
      assert.match(sitemap, /daily-notes\/2025\/2025-01-01/);
      assert.match(sitemap, /technology\/outside-note/);
      assert.match(
        sitemap,
        /daily-notes\/2025\/2025-01-02<\/loc>\s*<lastmod>2026-08-14T12:34:56\.000Z<\/lastmod>/,
      );

      const resources = plugin.externalResources?.(ctx);
      assert.equal(resources?.additionalHead?.length, 1);
      assert.equal(
        resources?.additionalHead?.[0]?.props?.href,
        "https://otton.org/index.xml",
      );
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  test("applies the RSS limit after sorting newest first", async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), "otton-content-index-limit-"),
    );

    try {
      const plugin = OttonContentIndex({
        enableSiteMap: false,
        enableRSS: true,
        rssLimit: 2,
        rssFullHtml: false,
        rssSlug: "index",
        rssFolder: "Daily Notes",
        rssIncludeEmptyFiles: false,
        rssGuid: "file-basename-hash",
        includeEmptyFiles: true,
        fields: { slug: { source: "data.slug" } },
      });
      const ctx = {
        argv: { output },
        cfg: {
          configuration: {
            pageTitle: "Work In Progress",
            baseUrl: "otton.org",
          },
        },
      } as BuildCtx;
      const content = [1, 2, 3].map((day) =>
        processedContent({
          slug: `daily-notes/2025/2025-01-0${day}`,
          relativePath: `Daily Notes/2025/2025-01-0${day}.md`,
          title: `Entry ${day}`,
          text: `Body ${day}`,
          date: `2025-01-0${day}T00:00:00Z`,
        }),
      );

      await plugin.emit(ctx, content, { css: [], js: [], additionalHead: [] });

      const rss = await readFile(path.join(output, "index.xml"), "utf8");
      assert.equal((rss.match(/<item>/g) ?? []).length, 2);
      assert.ok(rss.indexOf("Entry 3") < rss.indexOf("Entry 2"));
      assert.doesNotMatch(rss, /Entry 1/);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });
});
