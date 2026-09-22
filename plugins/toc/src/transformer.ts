import type { Root } from "mdast";
import { toString } from "mdast-util-to-string";
import Slugger from "github-slugger";
import { visit } from "unist-util-visit";
import type { QuartzTransformerPlugin } from "@quartz-community/types";

export interface TableOfContentsTransformerOptions {
  maxDepth: 1 | 2 | 3 | 4 | 5 | 6;
  minEntries: number;
  showByDefault: boolean;
  collapseByDefault: boolean;
}

export interface TocEntry {
  depth: number;
  text: string;
  slug: string;
}

const defaultOptions: TableOfContentsTransformerOptions = {
  maxDepth: 3,
  minEntries: 1,
  showByDefault: true,
  collapseByDefault: false,
};

export const TableOfContentsTransformer: QuartzTransformerPlugin<
  Partial<TableOfContentsTransformerOptions>
> = (userOptions) => {
  const options = { ...defaultOptions, ...userOptions };
  return {
    name: "TableOfContents",
    markdownPlugins() {
      return [
        () => async (tree: Root, file) => {
          const frontmatter = file.data.frontmatter as
            Record<string, unknown> | undefined;
          const display = frontmatter?.enableToc ?? options.showByDefault;
          if (!display) return;

          const slugger = new Slugger();
          const toc: TocEntry[] = [];
          let highestDepth: number = options.maxDepth;
          visit(tree, "heading", (node) => {
            if (node.depth > options.maxDepth) return;
            const text = toString(node);
            highestDepth = Math.min(highestDepth, node.depth);
            toc.push({ depth: node.depth, text, slug: slugger.slug(text) });
          });

          // Keep v4's minEntries semantics: a value of 1 requires at least two headings.
          if (toc.length > options.minEntries) {
            file.data.toc = toc.map((entry) => ({
              ...entry,
              depth: entry.depth - highestDepth,
            }));
            file.data.collapseToc = options.collapseByDefault;
          }
        },
      ];
    },
  };
};
