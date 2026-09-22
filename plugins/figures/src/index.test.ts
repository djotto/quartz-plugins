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
  OttonFigures,
  resolveImageAsset,
  transformOttonFigures,
} from "./index.js";

async function processFigures(markdown: string): Promise<Root> {
  const file = new VFile({ value: markdown });
  file.data.slug = "figure-test" as never;
  const ofm = ObsidianFlavoredMarkdown({ parseTags: false });
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
    .use(OttonFigures().htmlPlugins?.({} as never) ?? []);
  return (await htmlProcessor.run(mdast as never, file)) as Root;
}

function figures(tree: Root): Element[] {
  const result: Element[] = [];
  visit(tree, "element", (node: Element) => {
    if (node.tagName === "figure") result.push(node);
  });
  return result;
}

function firstChild(node: Element, tagName: string): Element {
  const child = node.children.find(
    (candidate): candidate is Element =>
      candidate.type === "element" && candidate.tagName === tagName,
  );
  assert.ok(child);
  return child;
}

describe("OttonFigures", () => {
  test("wraps a caption directive and preserves Markdown/HTML caption content", async () => {
    const tree = await processFigures(
      "{{caption}} _A map_ with a [source](https://example.com) <cite>Archive</cite>\n![[map.png|Map alt text]]",
    );
    const [figure] = figures(tree);
    assert.ok(figure);
    assert.deepEqual(figure.properties.className, undefined);
    const wrapper = tree.children.find(
      (node): node is Element =>
        node.type === "element" && node.tagName === "div",
    );
    assert.ok(wrapper);
    assert.deepEqual(wrapper.properties.className, ["figure-wrapper"]);
    const image = firstChild(figure, "img");
    assert.equal(image.properties.alt, "Map alt text");
    assert.equal(image.properties.loading, "lazy");
    const caption = firstChild(figure, "figcaption");
    const html = toHtml(caption);
    assert.match(html, /<em>A map<\/em>/);
    assert.match(html, /<a href="https:\/\/example.com">source<\/a>/);
    assert.match(html, /<cite>Archive<\/cite>/);
  });

  test("attaches a legacy colon caption to the preceding image", async () => {
    const tree = await processFigures(
      "![A sweater](sweater.jpg)\n\n: _American sweater_ (c. 1895) <cite>[source](https://example.com)</cite>",
    );
    const [figure] = figures(tree);
    assert.ok(figure);
    assert.equal(figures(tree).length, 1);
    assert.equal(firstChild(figure, "img").properties.alt, "A sweater");
    const caption = firstChild(figure, "figcaption");
    const html = toHtml(caption);
    assert.match(html, /^<figcaption><em>American sweater<\/em>/);
    assert.match(
      html,
      /<cite><a href="https:\/\/example\.com">source<\/a><\/cite>/,
    );
    assert.doesNotMatch(toHtml(tree), /<p>\s*:/);
  });

  test("builds the responsive before/after structure and accessible range label", async () => {
    const tree = await processFigures(
      "{{compare}} Historic map <cite>[source](https://example.com)</cite>\n![[before.png|Old map]]\n![[after.png|New map]]",
    );
    const [figure] = figures(tree);
    assert.ok(figure);
    assert.deepEqual(figure.properties.className, ["before-after"]);
    const stage = firstChild(figure, "div");
    assert.deepEqual(stage.properties.className, ["before-after__stage"]);
    const images: Element[] = [];
    visit(stage, "element", (node: Element) => {
      if (node.tagName === "img") images.push(node);
    });
    assert.equal(images.length, 2);
    assert.deepEqual(images[0]!.properties.className, [
      "before-after__image",
      "before-after__image--before",
    ]);
    assert.deepEqual(images[1]!.properties.className, [
      "before-after__image",
      "before-after__image--after",
    ]);
    const range = firstChild(stage, "input");
    assert.equal(range.properties.type, "range");
    assert.equal(
      range.properties["aria-label"],
      "Reveal comparison between Old map and New map",
    );
    assert.equal(
      toHtml(firstChild(figure, "figcaption")).includes("Historic map"),
      true,
    );
  });

  test("wraps ordinary standalone image paragraphs using the same figure structure", async () => {
    const tree = await processFigures("![A standalone image](image.png)");
    const [figure] = figures(tree);
    assert.ok(figure);
    const wrapper = tree.children.find(
      (node): node is Element =>
        node.type === "element" && node.tagName === "div",
    );
    assert.ok(wrapper);
    assert.deepEqual(wrapper.properties.className, ["figure-wrapper"]);
    assert.equal(
      firstChild(figure, "img").properties.alt,
      "A standalone image",
    );
  });

  for (const [label, markdown, mediaTags] of [
    [
      "Markdown images",
      "![First](first.png) ![Second](second.png)",
      ["img", "img"],
    ],
    ["wiki embeds", "![[first.png]] ![[second.png]]", ["img", "img"]],
    [
      "mixed raster and SVG embeds",
      "![[first.png]] ![[second.svg]]",
      ["img", "object"],
    ],
  ] as const) {
    test(`preserves same-line ${label} and the following image`, async () => {
      const tree = await processFigures(`${markdown}\n\n![Third](third.png)`);
      const wrapped = figures(tree);
      assert.equal(wrapped.length, 3);
      assert.deepEqual(
        wrapped.map((figure, index) => {
          assert.equal(figure.children.length, 1);
          const media = firstChild(figure, [...mediaTags, "img"][index]!);
          return media.properties.src ?? media.properties.data;
        }),
        [
          "first.png",
          mediaTags[1] === "object" ? "second.svg" : "second.png",
          "third.png",
        ],
      );
      assert.equal(
        tree.children.filter((node) => node.type === "element").length,
        3,
      );
    });
  }

  test("rejects malformed and unknown directives with source context", () => {
    const file = new VFile({ path: "notes/example.md", value: "" });
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "{{compare}} Caption" }],
        },
      ],
    };
    assert.throws(
      () => transformOttonFigures(tree, file),
      /notes\/example\.md.*expects exactly 2 following image paragraphs/,
    );
  });

  test("exposes plugin-owned styling and the slider runtime", () => {
    const resources = OttonFigures().externalResources?.({} as never);
    const css =
      resources?.css?.map((resource) => resource.content).join("\n") ?? "";
    const js =
      resources?.js
        ?.map((resource) => ("script" in resource ? resource.script : ""))
        .join("\n") ?? "";
    assert.match(css, /\.figure-wrapper/);
    assert.match(css, /\.before-after__after/);
    assert.match(css, /\.figcaption-carousel\.is-open/);
    assert.match(css, /@media all and \(max-width: 800px\)/);
    assert.match(js, /before-after__range/);
    assert.match(js, /pointerdown/);
    assert.match(js, /figcaption-carousel/);
  });

  test("publishes the carousel contract consumed by map figures and cleans detached state", () => {
    const resources = OttonFigures().externalResources?.({} as never);
    const js =
      resources?.js
        ?.map((resource) => ("script" in resource ? resource.script : ""))
        .join("\n") ?? "";
    assert.match(js, /__figcaptionCarouselRuntime = \{ openFigure/);
    assert.match(js, /figure\.directive-map/);
    assert.match(js, /prepareFigureForCarousel/);
    assert.match(js, /document\.contains\(carousel\)/);
    assert.match(js, /window\.addCleanup/);
  });

  test("resolves slugified assets with punctuation and Unicode names", () => {
    const root = "/site/content";
    const files = [
      `${root}/Portsmouth/assets/DALL·E 2024 (map).png`,
      `${root}/Portsmouth/other/DALL·E 2024 (map).png`,
    ];
    assert.equal(
      resolveImageAsset(
        root,
        "Portsmouth",
        "/portsmouth/assets/dall%C2%B7e-2024-%28map%29.png",
        files,
      ),
      files[0],
    );
    assert.equal(
      resolveImageAsset(
        root,
        "Portsmouth/other",
        "DALL·E 2024 (map).png",
        files,
      ),
      files[1],
    );
  });
});
