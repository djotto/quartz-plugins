import type { Root } from "mdast";
import type {
  BuildCtx,
  FullSlug,
  QuartzPluginData,
  QuartzTransformerPlugin,
} from "@quartz-community/types";
import {
  getFileExtension,
  slugTag,
  slugifyFilePath,
} from "@quartz-community/utils/path";
import { parse } from "yaml";
import type { VFile } from "vfile";

export interface FrontmatterOptions {
  delimiters?: string | [string, string];
}

type FrontmatterData = Record<string, unknown>;

type FrontmatterBlock = { content: string; endOffset: number };

function findYamlFrontmatter(
  source: string,
  delimiters: string | [string, string],
): FrontmatterBlock | undefined {
  const [opening, closing] = Array.isArray(delimiters)
    ? delimiters
    : [delimiters, delimiters];
  if (opening !== "---" || closing !== "---") return undefined;

  const openingMatch = /^(?:\uFEFF)?---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!openingMatch) return undefined;
  const bodyStart = openingMatch[0].length;
  const closingMatch = /^---[ \t]*(?:\r?\n|$)/gm;
  closingMatch.lastIndex = bodyStart;
  const match = closingMatch.exec(source);
  if (!match) return undefined;
  return {
    content: source.slice(bodyStart, match.index),
    endOffset: match.index + match[0].length,
  };
}

function coalesce(data: FrontmatterData, keys: string[]): unknown {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key];
  }
  return undefined;
}

function coerceArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value))
    return String(value)
      .split(",")
      .map((item) => item.trim());
  return value
    .filter(
      (item): item is string | number =>
        typeof item === "string" || typeof item === "number",
    )
    .map(String);
}

function aliasSlugs(aliases: string[]): FullSlug[] {
  return aliases.map((alias) => {
    const path = getFileExtension(alias) === ".md" ? alias : `${alias}.md`;
    return slugifyFilePath(path as never);
  });
}

function normalizeMetadata(
  data: FrontmatterData,
  file: VFile,
  ctx: BuildCtx,
): void {
  data.title =
    data.title != null && String(data.title) !== ""
      ? String(data.title)
      : (file.stem ?? "Untitled");

  const tags = coerceArray(coalesce(data, ["tags", "tag"]));
  if (tags) data.tags = [...new Set(tags.map((tag) => slugTag(tag)))];

  const aliases = coerceArray(coalesce(data, ["aliases", "alias"]));
  if (aliases) {
    data.aliases = aliases;
    file.data.aliases = aliasSlugs(aliases);
    ctx.allSlugs.push(...file.data.aliases);
  }

  if (data.permalink != null && String(data.permalink) !== "") {
    const permalink = String(data.permalink) as FullSlug;
    data.permalink = permalink;
    file.data.aliases = [
      ...((file.data.aliases as FullSlug[] | undefined) ?? []),
      permalink,
    ];
    ctx.allSlugs.push(permalink);
  }

  const cssclasses = coerceArray(coalesce(data, ["cssclasses", "cssclass"]));
  if (cssclasses) data.cssclasses = cssclasses;

  const created = coalesce(data, ["created", "date"]);
  if (created) data.created = created;
  const modified = coalesce(data, [
    "modified",
    "lastmod",
    "updated",
    "last-modified",
  ]);
  if (modified) data.modified = modified;
  data.modified ||= created;

  const published = coalesce(data, ["published", "publishDate", "date"]);
  if (published) data.published = published;

  const socialImage = coalesce(data, ["socialImage", "image", "cover"]);
  if (socialImage) data.socialImage = socialImage;

  ctx.allSlugs.splice(0, ctx.allSlugs.length, ...new Set(ctx.allSlugs));
  file.data.frontmatter = data as QuartzPluginData["frontmatter"];
}

function stripFrontmatter(tree: Root, endOffset: number): void {
  tree.children = tree.children.filter((node) => {
    const start = node.position?.start.offset;
    return start === undefined || start >= endOffset;
  });
}

export const OttonFrontmatter: QuartzTransformerPlugin<FrontmatterOptions> = (
  options,
) => ({
  name: "OttonFrontmatter",
  markdownPlugins(ctx) {
    const delimiters = options?.delimiters ?? "---";
    return [
      () => (tree: Root, file: VFile) => {
        const source =
          typeof file.value === "string"
            ? file.value
            : Buffer.from(file.value as Uint8Array).toString();
        const block = findYamlFrontmatter(source, delimiters);
        let data: FrontmatterData = {};
        if (block) {
          const parsed = parse(block.content);
          data =
            parsed && typeof parsed === "object" && !Array.isArray(parsed)
              ? (parsed as FrontmatterData)
              : {};
          // remark-parse ignores a leading BOM when assigning source offsets.
          stripFrontmatter(
            tree,
            block.endOffset - (source.startsWith("\uFEFF") ? 1 : 0),
          );
        }
        normalizeMetadata(data, file, ctx);
      },
    ];
  },
});

export const FrontMatter = OttonFrontmatter;

declare module "vfile" {
  interface DataMap {
    aliases: FullSlug[];
  }
}

export default OttonFrontmatter;
