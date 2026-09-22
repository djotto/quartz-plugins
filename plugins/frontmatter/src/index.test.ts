import assert from "node:assert/strict";
import test from "node:test";
import type { BuildCtx } from "@quartz-community/types";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { VFile } from "vfile";
import { OttonFrontmatter } from "./index.js";

function context(allSlugs: string[] = []): BuildCtx {
  return {
    allSlugs,
    cfg: { configuration: {} },
    argv: {},
    buildId: "test",
    allFiles: [],
    incremental: false,
  } as unknown as BuildCtx;
}

async function process(markdown: string, allSlugs: string[] = []) {
  const file = new VFile({ path: "Notes/Example.md", value: markdown });
  const ctx = context(allSlugs);
  const plugin = OttonFrontmatter().markdownPlugins!(ctx);
  const processor = unified().use(remarkParse).use(plugin);
  const tree = (await processor.run(processor.parse(file), file)) as Root;
  return { file, tree, allSlugs };
}

test("parses YAML frontmatter and strips every frontmatter AST node", async () => {
  const { file, tree } = await process(
    "---\ntitle: A Note\ndescription: Hello\n---\n\n# Content\n\nBody",
  );

  assert.equal(file.data.frontmatter.title, "A Note");
  assert.equal(file.data.frontmatter.description, "Hello");
  assert.deepEqual(
    tree.children.map((node) => node.type),
    ["heading", "paragraph"],
  );
  assert.equal(
    (tree.children[0] as { position?: { start: { line: number } } }).position
      ?.start.line,
    6,
  );
});

test("normalizes tags, aliases, permalink, CSS classes, and date aliases", async () => {
  const allSlugs = ["existing"];
  const { file, allSlugs: result } = await process(
    "---\ntag: [One, Two]\nalias: [Old Note, Existing.md]\npermalink: custom/path\ncssclass: wide\ndate: 2024-01-02\n---\nText",
    allSlugs,
  );
  const frontmatter = file.data.frontmatter;

  assert.deepEqual(frontmatter.tags, ["one", "two"]);
  assert.deepEqual(frontmatter.aliases, ["Old Note", "Existing.md"]);
  assert.deepEqual(file.data.aliases, ["old-note", "existing", "custom/path"]);
  assert.equal(frontmatter.cssclasses?.[0], "wide");
  assert.equal(frontmatter.created, "2024-01-02");
  assert.equal(frontmatter.modified, "2024-01-02");
  assert.equal(frontmatter.published, "2024-01-02");
  assert.deepEqual(result, ["existing", "old-note", "custom/path"]);
});

test("supports a BOM and title fallback without a frontmatter block", async () => {
  const bom = await process("\uFEFF---\n---\nBody");
  assert.equal(bom.file.data.frontmatter.title, "Example");
  assert.equal(bom.tree.children.length, 1);

  const noMatter = await process("# Body");
  assert.equal(noMatter.file.data.frontmatter.title, "Example");
  assert.equal(noMatter.tree.children.length, 1);
});
