import type { Root as HtmlRoot } from "hast";
import type { Root as MdRoot } from "mdast";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type {
  BuildCtx,
  QuartzTransformerPlugin,
} from "@quartz-community/types";
import type { PluggableList } from "unified";
import { VFile } from "vfile";

export interface DescriptionMarkdownOptions {}

const pipelineNames = new Set([
  "ObsidianFlavoredMarkdown",
  "GitHubFlavoredMarkdown",
  "HardLineBreaks",
  "LinkProcessing",
  "Latex",
]);

type Transformer = {
  name: string;
  textTransform?: (ctx: BuildCtx, source: string) => string;
  markdownPlugins?: (ctx: BuildCtx) => PluggableList;
  htmlPlugins?: (ctx: BuildCtx) => PluggableList;
};

function configuredTransformers(ctx: BuildCtx): Transformer[] {
  const configured = (
    ctx.cfg as unknown as { plugins?: { transformers?: unknown[] } }
  ).plugins?.transformers;
  return (configured ?? []).filter(
    (plugin): plugin is Transformer =>
      typeof plugin === "object" &&
      plugin !== null &&
      typeof (plugin as { name?: unknown }).name === "string" &&
      pipelineNames.has((plugin as { name: string }).name),
  );
}

/** Convert unparsed wikilinks when OFM is not available (useful for isolated builds/tests). */
function fallbackWikilinks() {
  return () => (tree: MdRoot) => {
    type MutableMdNode = {
      type: string;
      value?: unknown;
      children?: MutableMdNode[];
      [key: string]: unknown;
    };
    const visitChildren = (parent: MutableMdNode) => {
      if (!parent.children) return;
      const next: MutableMdNode[] = [];
      for (const child of parent.children) {
        if (child.type !== "text" || typeof child.value !== "string") {
          if (child.children) visitChildren(child);
          next.push(child);
          continue;
        }
        const pattern = /!?\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
        let cursor = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(child.value)) !== null) {
          if (match.index > cursor)
            next.push({
              type: "text",
              value: child.value.slice(cursor, match.index),
            });
          const target = match[1]?.trim() ?? "";
          const anchor = match[2]?.trim();
          const label = match[3]?.trim() || target;
          next.push({
            type: "link",
            title: null,
            url: `${target}${anchor ? `#${anchor}` : ""}`,
            children: [{ type: "text", value: label }],
          });
          cursor = match.index + match[0].length;
        }
        if (cursor === 0) next.push(child);
        else if (cursor < child.value.length)
          next.push({ type: "text", value: child.value.slice(cursor) });
      }
      parent.children = next;
    };
    visitChildren(tree as unknown as MutableMdNode);
  };
}

function uniquePlugins(plugins: PluggableList): PluggableList {
  return plugins.filter((plugin, index) => plugins.indexOf(plugin) === index);
}

/**
 * Parse one frontmatter description through the same configured transformers used by page content.
 * This deliberately accepts only frontmatter.description; generated descriptions never recurse.
 */
export async function descriptionMarkdownToHast(
  value: unknown,
  ctx: BuildCtx,
  file: VFile,
): Promise<HtmlRoot | undefined> {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const transformers = configuredTransformers(ctx);
  let source = value.trim();
  for (const transformer of transformers) {
    if (transformer.textTransform)
      source = transformer.textTransform(ctx, source);
  }

  const descriptionFile = new VFile({ value: source });
  descriptionFile.data.slug = file.data.slug;
  descriptionFile.data.filePath = file.data.filePath;
  const markdownPlugins: PluggableList = transformers.flatMap(
    (plugin) => plugin.markdownPlugins?.(ctx) ?? [],
  );
  markdownPlugins.push(fallbackWikilinks());
  const mdProcessor = unified()
    .use(remarkParse)
    .use(uniquePlugins(markdownPlugins));
  const mdAst = mdProcessor.parse(descriptionFile) as MdRoot;
  const transformed = (await mdProcessor.run(mdAst, descriptionFile)) as MdRoot;
  const htmlPlugins: PluggableList = transformers.flatMap(
    (plugin) => plugin.htmlPlugins?.(ctx) ?? [],
  );
  const htmlProcessor = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(htmlPlugins);
  return (await htmlProcessor.run(transformed, descriptionFile)) as HtmlRoot;
}

export const DescriptionMarkdown: QuartzTransformerPlugin<
  Partial<DescriptionMarkdownOptions>
> = () => ({
  name: "DescriptionMarkdown",
  htmlPlugins(ctx) {
    return [
      () => async (_tree: HtmlRoot, file: VFile) => {
        const frontmatter = file.data.frontmatter as
          Record<string, unknown> | undefined;
        const rendered = await descriptionMarkdownToHast(
          frontmatter?.description,
          ctx,
          file,
        );
        if (rendered) file.data.descriptionHtml = rendered;
      },
    ];
  },
});

declare module "vfile" {
  interface DataMap {
    descriptionHtml?: HtmlRoot;
  }
}
