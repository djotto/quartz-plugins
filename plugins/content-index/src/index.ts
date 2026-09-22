import path from "node:path";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Root } from "hast";
import { h } from "preact";
import { visit } from "unist-util-visit";
import type {
  BuildCtx,
  FilePath,
  FullSlug,
  GlobalConfiguration,
  ProcessedContent,
  QuartzEmitterPlugin,
  QuartzPluginData,
  SimpleSlug,
} from "@quartz-community/types";
import { joinSegments } from "@quartz-community/types";
import { escapeHTML, simplifySlug } from "@quartz-community/utils";
import { getDate } from "@quartz-community/utils/sort";

export type ContentIndexMap = Map<FullSlug, ContentDetails>;

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type FieldSpec = {
  source: string;
  default?: JsonValue;
};

type FieldConfig = Record<string, FieldSpec>;

export type ContentDetails = {
  slug: FullSlug;
  filePath: FilePath;
  title: string;
  links: SimpleSlug[];
  tags: string[];
  content: string;
  richContent?: string;
  date?: Date;
  lastModified?: Date;
  description?: string;
};

type RssEntry = ContentDetails & {
  guid: string;
};

type RssGuidMode = "permalink" | "file-basename-hash";

interface Options {
  enableSiteMap: boolean;
  enableRSS: boolean;
  rssLimit?: number;
  rssFullHtml: boolean;
  rssSlug: string;
  rssFolder?: string;
  rssIncludeEmptyFiles?: boolean;
  rssGuid: RssGuidMode;
  includeEmptyFiles: boolean;
  rssRecentNotesText?: string;
  rssLastFewNotesText?: (count: number) => string;
  fields?: FieldConfig;
}

const defaultOptions: Omit<Options, "fields"> = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  rssSlug: "index",
  rssFolder: undefined,
  rssIncludeEmptyFiles: undefined,
  rssGuid: "permalink",
  includeEmptyFiles: true,
  rssRecentNotesText: "Recent notes",
  rssLastFewNotesText: (count) => `Last ${count} notes`,
};

const write = async (args: {
  ctx: BuildCtx;
  content: string;
  slug: FullSlug;
  ext: string;
}): Promise<FilePath> => {
  const pathToPage = joinSegments(
    args.ctx.argv.output,
    args.slug + args.ext,
  ) as FilePath;
  const dir = path.dirname(pathToPage);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pathToPage, args.content);
  return pathToPage;
};

function failConfig(message: string): never {
  process.exitCode = 1;
  throw new Error(`ContentIndex: ${message}`);
}

function assertFields(fields: FieldConfig | undefined): FieldConfig {
  if (!fields || Object.keys(fields).length === 0) {
    failConfig(
      "options.fields is required and must declare the contentIndex.json fields",
    );
  }

  for (const [name, spec] of Object.entries(fields)) {
    if (!spec || typeof spec !== "object" || typeof spec.source !== "string") {
      failConfig(`field "${name}" must have a string source`);
    }
    if (!isSupportedSource(spec.source)) {
      failConfig(
        `field "${name}" uses unsupported source "${spec.source}". Supported roots: data, frontmatter, computed`,
      );
    }
  }

  return fields;
}

function isSupportedSource(source: string): boolean {
  return (
    source === "data" ||
    source.startsWith("data.") ||
    source === "frontmatter" ||
    source.startsWith("frontmatter.") ||
    source === "computed" ||
    source.startsWith("computed.")
  );
}

function getPath(
  source: Record<string, unknown>,
  pathSegments: string[],
): unknown {
  let value: unknown = source;
  for (const segment of pathSegments) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

function resolveSource(
  source: string,
  data: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
  computed: Record<string, unknown>,
): unknown {
  const [root, ...pathSegments] = source.split(".");
  if (root === "data")
    return pathSegments.length === 0 ? data : getPath(data, pathSegments);
  if (root === "frontmatter") {
    return pathSegments.length === 0
      ? frontmatter
      : getPath(frontmatter, pathSegments);
  }
  if (root === "computed") {
    return pathSegments.length === 0
      ? computed
      : getPath(computed, pathSegments);
  }
  return undefined;
}

function toJsonValue(fieldName: string, value: unknown): JsonValue {
  if (value === undefined) return undefined as never;
  try {
    JSON.stringify(value);
  } catch {
    failConfig(
      `field "${fieldName}" resolved to a non-JSON-serializable value`,
    );
  }
  return value as JsonValue;
}

function buildIndexEntry(
  fields: FieldConfig,
  data: Record<string, unknown>,
  frontmatter: Record<string, unknown>,
  computed: Record<string, unknown>,
): Record<string, JsonValue> {
  const entry: Record<string, JsonValue> = {};

  for (const [name, spec] of Object.entries(fields)) {
    const resolved = resolveSource(spec.source, data, frontmatter, computed);
    const value = resolved === undefined ? spec.default : resolved;
    if (value === undefined) continue;

    entry[name] = toJsonValue(name, value);
  }

  return entry;
}

async function computeRichContent(
  options: Options,
  isEncrypted: boolean,
  tree: Root,
): Promise<string | undefined> {
  if (!options.rssFullHtml || isEncrypted) return undefined;

  const { toHtml } = await import("hast-util-to-html");
  return escapeHTML(toHtml(tree, { allowDangerousHtml: true }));
}

function normalizePathSegment(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^content\//i, "")
    .toLowerCase();
}

function isInFolder(filePath: string, folder: string): boolean {
  const normalizedPath = normalizePathSegment(filePath);
  const normalizedFolder = normalizePathSegment(folder);
  return (
    normalizedPath === normalizedFolder ||
    normalizedPath.startsWith(`${normalizedFolder}/`)
  );
}

// Hash only the basename so an entry keeps the same GUID if a Daily Note moves
// between year/month folders. This intentionally preserves the v4 feed behavior.
function stableGuidFromFilePath(filePath: FilePath): string {
  const fileName = filePath.split("/").at(-1) ?? filePath;
  return createHash("sha256").update(fileName).digest("hex");
}

function absolutizeUrl(rawUrl: string, pageUrl: string): string {
  if (
    rawUrl === "" ||
    rawUrl.startsWith("#") ||
    rawUrl.startsWith("mailto:") ||
    rawUrl.startsWith("tel:") ||
    rawUrl.startsWith("javascript:") ||
    rawUrl.startsWith("data:")
  ) {
    return rawUrl;
  }

  try {
    return new URL(rawUrl, pageUrl).toString();
  } catch {
    return rawUrl;
  }
}

function absolutizeSrcSet(srcset: string, pageUrl: string): string {
  return srcset
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0)
    .map((candidate) => {
      const [urlPart, ...descriptorParts] = candidate.split(/\s+/);
      return [absolutizeUrl(urlPart, pageUrl), ...descriptorParts].join(" ");
    })
    .join(", ");
}

async function renderRssHtml(rawTree: Root, pageUrl: string): Promise<string> {
  const tree = structuredClone(rawTree);
  visit(tree, "element", (node) => {
    const properties = node.properties as Record<string, unknown> | undefined;
    if (!properties) return;

    const href = properties.href;
    if (typeof href === "string") {
      properties.href = absolutizeUrl(href, pageUrl);
    }

    const src = properties.src;
    if (typeof src === "string") {
      properties.src = absolutizeUrl(src, pageUrl);
    }

    const srcSet = properties.srcset ?? properties.srcSet;
    if (typeof srcSet === "string") {
      const absoluteSrcSet = absolutizeSrcSet(srcSet, pageUrl);
      if ("srcset" in properties) properties.srcset = absoluteSrcSet;
      if ("srcSet" in properties) properties.srcSet = absoluteSrcSet;
    }
  });

  const { toHtml } = await import("hast-util-to-html");
  return toHtml(tree, { allowDangerousHtml: true });
}

function rssGuid(
  mode: RssGuidMode,
  base: string,
  slug: SimpleSlug,
  filePath: FilePath,
): string {
  if (mode === "file-basename-hash") return stableGuidFromFilePath(filePath);
  return `https://${joinSegments(base, encodeURI(slug))}`;
}

function generateSiteMap(
  cfg: GlobalConfiguration,
  idx: ContentIndexMap,
): string {
  const base = cfg.baseUrl ?? "";
  const createURLEntry = (
    slug: SimpleSlug,
    content: ContentDetails,
  ): string => `<url>
    <loc>https://${joinSegments(base, encodeURI(slug))}</loc>
    ${content.lastModified && `<lastmod>${content.lastModified.toISOString()}</lastmod>`}
  </url>`;
  const urls = Array.from(idx)
    .map(([slug, content]) =>
      createURLEntry(simplifySlug(slug) as SimpleSlug, content),
    )
    .join("");
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}

function generateRSSFeed(
  cfg: GlobalConfiguration,
  entries: RssEntry[],
  options: Options,
  limit?: number,
): string {
  const base = cfg.baseUrl ?? "";
  const pageTitle = cfg.pageTitle ?? "";
  const recentNotesText = options.rssRecentNotesText ?? "Recent notes";
  const lastFewNotesText =
    options.rssLastFewNotesText ?? ((count: number) => `Last ${count} notes`);

  const createURLEntry = (entry: RssEntry): string => `<item>
    <title>${escapeHTML(entry.title)}</title>
    <link>https://${joinSegments(base, encodeURI(simplifySlug(entry.slug) as SimpleSlug))}</link>
    <guid isPermaLink="false">${entry.guid}</guid>
    <description><![CDATA[ ${entry.richContent ?? entry.description} ]]></description>
    <pubDate>${entry.date?.toUTCString()}</pubDate>
  </item>`;

  const items = entries
    .sort((f1, f2) => {
      if (f1.date && f2.date) return f2.date.getTime() - f1.date.getTime();
      if (f1.date && !f2.date) return -1;
      if (!f1.date && f2.date) return 1;
      return f1.title.localeCompare(f2.title);
    })
    .slice(0, limit ?? entries.length)
    .map(createURLEntry)
    .join("");

  const description = `${
    limit ? lastFewNotesText(limit) : recentNotesText
  } on ${escapeHTML(pageTitle)}`;

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(pageTitle)}</title>
      <link>https://${base}</link>
      <description>${description}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items}
    </channel>
  </rss>`;
}

export const OttonContentIndex: QuartzEmitterPlugin<Partial<Options>> = (
  opts,
) => {
  const options: Options = { ...defaultOptions, ...opts };

  const emitAll = async (
    ctx: BuildCtx,
    content: ProcessedContent[],
  ): Promise<FilePath[]> => {
    const fields = assertFields(options.fields);
    const cfg = ctx.cfg.configuration;
    const linkIndex: ContentIndexMap = new Map();
    const indexEntries: Record<string, Record<string, JsonValue>> = {};
    const rssEntries: RssEntry[] = [];

    for (const [tree, file] of content) {
      const data = (file.data as Record<string, unknown>) ?? {};
      if (data.unlisted === true) continue;

      const slug = data.slug as FullSlug;
      const pluginData = data as QuartzPluginData;
      const date = getDate(pluginData) ?? new Date();
      const text = data.text as string | undefined;
      const frontmatter =
        (data.frontmatter as Record<string, unknown> | undefined) ?? {};
      const isEncrypted = data.encrypted === true;
      const rawFilePath = data.relativePath ?? data.filePath;
      const filePath =
        typeof rawFilePath === "string"
          ? (rawFilePath as FilePath)
          : ("" as FilePath);

      const details: ContentDetails = {
        slug,
        filePath,
        title: (frontmatter.title as string) ?? "",
        links: (data.links as SimpleSlug[] | undefined) ?? [],
        tags: (frontmatter.tags as string[] | undefined) ?? [],
        content: text ?? "",
        date,
        lastModified: pluginData.dates?.modified,
        description: (data.description as string | undefined) ?? "",
      };

      if (options.includeEmptyFiles || (text && text !== "")) {
        const richContent = await computeRichContent(
          options,
          isEncrypted,
          tree as Root,
        );
        linkIndex.set(slug, details);
        indexEntries[slug] = buildIndexEntry(fields, data, frontmatter, {
          richContent,
        });
      }

      const rssIncludesEmptyFiles =
        options.rssIncludeEmptyFiles ?? options.includeEmptyFiles;
      const isRssFolder =
        !options.rssFolder ||
        (filePath !== "" && isInFolder(filePath, options.rssFolder));
      const isRssContent = rssIncludesEmptyFiles || (text && text !== "");

      if (options.enableRSS && filePath !== "" && isRssFolder && isRssContent) {
        const simpleSlug = simplifySlug(slug) as SimpleSlug;
        const pageUrl = `https://${joinSegments(
          cfg.baseUrl ?? "example.com",
          encodeURI(simpleSlug),
        )}`;
        rssEntries.push({
          ...details,
          guid: rssGuid(
            options.rssGuid,
            cfg.baseUrl ?? "",
            simpleSlug,
            filePath,
          ),
          richContent:
            options.rssFullHtml && !isEncrypted
              ? await renderRssHtml(tree as Root, pageUrl)
              : undefined,
        });
      }
    }

    const outputs: FilePath[] = [];
    if (options.enableSiteMap) {
      outputs.push(
        await write({
          ctx,
          content: generateSiteMap(cfg, linkIndex),
          slug: "sitemap" as FullSlug,
          ext: ".xml",
        }),
      );
    }

    if (options.enableRSS) {
      outputs.push(
        await write({
          ctx,
          content: generateRSSFeed(cfg, rssEntries, options, options.rssLimit),
          slug: (options.rssSlug ?? "index") as FullSlug,
          ext: ".xml",
        }),
      );
    }

    outputs.push(
      await write({
        ctx,
        content: JSON.stringify(indexEntries),
        slug: joinSegments("static", "contentIndex") as unknown as FullSlug,
        ext: ".json",
      }),
    );

    return outputs;
  };

  return {
    name: "ContentIndex",
    emit: (ctx, content) => emitAll(ctx, content),
    partialEmit: (ctx, content) => emitAll(ctx, content),
    externalResources: (ctx) => {
      if (!options.enableRSS || !ctx.cfg.configuration.baseUrl) return;

      return {
        additionalHead: [
          h("link", {
            rel: "alternate",
            type: "application/rss+xml",
            title: "RSS Feed",
            href: `https://${joinSegments(
              ctx.cfg.configuration.baseUrl,
              `${options.rssSlug}.xml`,
            )}`,
          }),
        ],
      };
    },
  };
};

export default OttonContentIndex;
