import assert from "node:assert/strict";
import { test } from "node:test";
import { toHtml } from "hast-util-to-html";
import { VFile } from "vfile";
import { descriptionMarkdownToHast } from "./transformer.js";
import type { BuildCtx } from "@quartz-community/types";

const context = (transformers: unknown[] = []): BuildCtx =>
  ({
    cfg: { plugins: { transformers } },
    allSlugs: ["notes/target"],
    argv: {},
  }) as unknown as BuildCtx;

test("renders emphasis and wiki links through the configured description pipeline", async () => {
  const file = new VFile("body");
  file.data.slug = "notes/source" as never;
  file.data.filePath = "notes/source.md" as never;
  const html = await descriptionMarkdownToHast(
    "A *rich* description linking [[notes/target|the target]].",
    context(),
    file,
  );
  assert.ok(html);
  const output = toHtml(html!);
  assert.match(output, /<em>rich<\/em>/);
  assert.match(output, /href="notes\/target"/);
  assert.match(output, />the target<\/a>/);
});

test("runs configured link processing without reading generated descriptions", async () => {
  const file = new VFile("body");
  file.data.slug = "notes/source" as never;
  file.data.filePath = "notes/source.md" as never;
  let seen = "";
  const rewriteLink = (tree: {
    children: Array<{
      type: string;
      tagName?: string;
      children?: unknown[];
      properties?: Record<string, unknown>;
    }>;
  }) => {
    const paragraph = tree.children[0];
    const anchor = (paragraph?.children ?? []).find((node) => {
      const candidate = node as { type?: string; tagName?: string };
      return candidate.type === "element" && candidate.tagName === "a";
    }) as { properties?: Record<string, unknown> } | undefined;
    if (anchor) {
      anchor.properties = { href: "/target" };
      seen = "/target";
    }
  };
  const linkProcessing = {
    name: "LinkProcessing",
    htmlPlugins: () => [() => rewriteLink],
  };
  const html = await descriptionMarkdownToHast(
    "[[target]]",
    context([linkProcessing]),
    file,
  );
  assert.ok(html);
  assert.equal(seen, "/target");
  assert.match(toHtml(html!), /href="\/target"/);
});
