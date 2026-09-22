// src/transformer.ts
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";
var pipelineNames = /* @__PURE__ */ new Set([
  "ObsidianFlavoredMarkdown",
  "GitHubFlavoredMarkdown",
  "HardLineBreaks",
  "LinkProcessing",
  "Latex"
]);
function configuredTransformers(ctx) {
  const configured = ctx.cfg.plugins?.transformers;
  return (configured ?? []).filter(
    (plugin) => typeof plugin === "object" && plugin !== null && typeof plugin.name === "string" && pipelineNames.has(plugin.name)
  );
}
function fallbackWikilinks() {
  return () => (tree) => {
    const visitChildren = (parent) => {
      if (!parent.children) return;
      const next = [];
      for (const child of parent.children) {
        if (child.type !== "text" || typeof child.value !== "string") {
          if (child.children) visitChildren(child);
          next.push(child);
          continue;
        }
        const pattern = /!?\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
        let cursor = 0;
        let match;
        while ((match = pattern.exec(child.value)) !== null) {
          if (match.index > cursor)
            next.push({
              type: "text",
              value: child.value.slice(cursor, match.index)
            });
          const target = match[1]?.trim() ?? "";
          const anchor = match[2]?.trim();
          const label = match[3]?.trim() || target;
          next.push({
            type: "link",
            title: null,
            url: `${target}${anchor ? `#${anchor}` : ""}`,
            children: [{ type: "text", value: label }]
          });
          cursor = match.index + match[0].length;
        }
        if (cursor === 0) next.push(child);
        else if (cursor < child.value.length)
          next.push({ type: "text", value: child.value.slice(cursor) });
      }
      parent.children = next;
    };
    visitChildren(tree);
  };
}
function uniquePlugins(plugins) {
  return plugins.filter((plugin, index) => plugins.indexOf(plugin) === index);
}
async function descriptionMarkdownToHast(value, ctx, file) {
  if (typeof value !== "string" || value.trim().length === 0) return void 0;
  const transformers = configuredTransformers(ctx);
  let source = value.trim();
  for (const transformer of transformers) {
    if (transformer.textTransform)
      source = transformer.textTransform(ctx, source);
  }
  const descriptionFile = new VFile({ value: source });
  descriptionFile.data.slug = file.data.slug;
  descriptionFile.data.filePath = file.data.filePath;
  const markdownPlugins = transformers.flatMap(
    (plugin) => plugin.markdownPlugins?.(ctx) ?? []
  );
  markdownPlugins.push(fallbackWikilinks());
  const mdProcessor = unified().use(remarkParse).use(uniquePlugins(markdownPlugins));
  const mdAst = mdProcessor.parse(descriptionFile);
  const transformed = await mdProcessor.run(mdAst, descriptionFile);
  const htmlPlugins = transformers.flatMap(
    (plugin) => plugin.htmlPlugins?.(ctx) ?? []
  );
  const htmlProcessor = unified().use(remarkRehype, { allowDangerousHtml: true }).use(htmlPlugins);
  return await htmlProcessor.run(transformed, descriptionFile);
}
var DescriptionMarkdown = () => ({
  name: "DescriptionMarkdown",
  htmlPlugins(ctx) {
    return [
      () => async (_tree, file) => {
        const frontmatter = file.data.frontmatter;
        const rendered = await descriptionMarkdownToHast(
          frontmatter?.description,
          ctx,
          file
        );
        if (rendered) file.data.descriptionHtml = rendered;
      }
    ];
  }
});
export {
  DescriptionMarkdown
};
