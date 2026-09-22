import assert from "node:assert/strict";
import test, { describe } from "node:test";
import type { Element, Root } from "hast";
import { toHtml } from "hast-util-to-html";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { ObsidianFlavoredMarkdown } from "@quartz-community/obsidian-flavored-markdown";
import {
  normalizeCalloutMetadata,
  OttonCallouts,
  transformOttonCallouts,
} from "./index.js";

async function processCallouts(markdown: string): Promise<Root> {
  const file = new VFile({ value: markdown });
  file.data.slug = "callout-test" as never;

  const ofm = ObsidianFlavoredMarkdown({
    wikilinks: false,
    parseTags: false,
  });
  const ottonCallouts = OttonCallouts();

  const markdownProcessor = unified()
    .use(remarkParse)
    .use(ofm.markdownPlugins?.({} as never) ?? []);
  const mdast = await markdownProcessor.run(
    markdownProcessor.parse(file),
    file,
  );

  const htmlProcessor = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(ofm.htmlPlugins?.({} as never) ?? [])
    .use(ottonCallouts.htmlPlugins?.({} as never) ?? []);

  return (await htmlProcessor.run(mdast as never, file)) as Root;
}

function callouts(tree: Root): Element[] {
  const result: Element[] = [];
  visit(tree, "element", (node: Element) => {
    if (
      node.tagName === "blockquote" &&
      node.properties.dataCallout !== undefined
    ) {
      result.push(node);
    }
  });
  return result;
}

function titleHtml(node: Element): string {
  const title = node.children.find(
    (child): child is Element =>
      child.type === "element" &&
      Array.isArray(child.properties.className) &&
      child.properties.className.includes("callout-title"),
  );
  assert.ok(title);
  return toHtml(title);
}

describe("OttonCallouts", () => {
  test("normalizes and deduplicates source and variant metadata", async () => {
    const tree = await processCallouts(
      "> [!quote +SOURCE:Book +TANGENT +source:BOOK +tangent]\n> Quoted text.",
    );
    const [callout] = callouts(tree);

    assert.ok(callout);
    assert.equal(
      callout.properties.dataCalloutMetadata,
      "+source:book +tangent",
    );
    assert.equal(callout.properties.dataCalloutSource, "book");
    assert.equal(callout.properties.dataCalloutVariants, "tangent");
  });

  test("uses Tangent for the implicit title", async () => {
    const tree = await processCallouts("> [!note +tangent]\n> Side note.");
    const [callout] = callouts(tree);

    assert.ok(callout);
    assert.match(titleHtml(callout), />Tangent</);
    assert.doesNotMatch(titleHtml(callout), />Note</);
  });

  test("preserves explicit titles, including the base default title", async () => {
    const tree = await processCallouts("> [!note +TANGENT] Note\n> Side note.");
    const [callout] = callouts(tree);

    assert.ok(callout);
    assert.match(titleHtml(callout), />Note\s*</);
    assert.doesNotMatch(titleHtml(callout), />Tangent</);
  });

  test("handles nested callouts and inherits OFM cite canonicalization", async () => {
    const tree = await processCallouts(`> [!note +tangent]
>
> Outer body.
>
> > [!cite +SOURCE:Newspaper]
> >
> > Nested quotation.`);
    const [outer, nested] = callouts(tree);

    assert.ok(outer);
    assert.ok(nested);
    assert.equal(outer.properties.dataCalloutVariants, "tangent");
    assert.match(titleHtml(outer), />Tangent</);
    assert.equal(nested.properties.dataCallout, "quote");
    assert.equal(nested.properties.dataCalloutMetadata, "+source:newspaper");
    assert.equal(nested.properties.dataCalloutSource, "newspaper");
  });

  test("keeps v4 normalization semantics for non-variant metadata", () => {
    assert.deepEqual(
      normalizeCalloutMetadata("  Label +LOUD Label +loud other  "),
      {
        normalized: "Label +loud other",
        source: undefined,
        variants: ["loud"],
      },
    );
  });

  test("serves plugin-owned styles for all custom icons and tangent colors", () => {
    const resources = OttonCallouts().externalResources?.({} as never);
    const css =
      resources?.css?.map((resource) => resource.content).join("\n") ?? "";

    assert.match(css, /--callout-icon-book:/);
    assert.match(css, /--callout-icon-newspaper:/);
    assert.match(css, /--callout-icon-tangent:/);
    assert.match(css, /data-callout-variants~="tangent"/);
    assert.match(css, /#7a43b5/);
  });

  test("normalizes dashed HAST properties and restores callout classes", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "blockquote",
          properties: {
            "data-callout": "CITE",
            "data-callout-metadata": "+SOURCE:Newspaper +Tangent",
            class: "quote legacy-class",
          },
          children: [],
        },
      ],
    };

    transformOttonCallouts(tree, new VFile({ value: "" }));
    const callout = tree.children[0] as Element;

    assert.equal(callout.properties.dataCallout, "quote");
    assert.equal(callout.properties.dataCalloutSource, "newspaper");
    assert.equal(callout.properties.dataCalloutVariants, "tangent");
    assert.deepEqual(callout.properties.className, [
      "callout",
      "quote",
      "legacy-class",
    ]);
    assert.equal(callout.properties["data-callout"], undefined);
  });

  test("normalizes a callout with only a type property", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "blockquote",
          properties: { type: "NOTE", className: "legacy-class" as never },
          children: [],
        },
      ],
    };

    transformOttonCallouts(tree, new VFile({ value: "" }));
    const callout = tree.children[0] as Element;

    assert.equal(callout.properties.dataCallout, "note");
    assert.equal(callout.properties.dataCalloutMetadata, "");
    assert.deepEqual(callout.properties.className, [
      "callout",
      "legacy-class",
      "note",
    ]);
  });
});
