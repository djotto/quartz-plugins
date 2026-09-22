// src/index.ts
import path from "node:path";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { h } from "preact";
import { visit } from "unist-util-visit";
import { joinSegments } from "@quartz-community/types";
import { escapeHTML, simplifySlug } from "@quartz-community/utils";
import { getDate } from "@quartz-community/utils/sort";
var defaultOptions = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  rssSlug: "index",
  rssFolder: void 0,
  rssIncludeEmptyFiles: void 0,
  rssGuid: "permalink",
  includeEmptyFiles: true,
  rssRecentNotesText: "Recent notes",
  rssLastFewNotesText: (count) => `Last ${count} notes`
};
var write = async (args) => {
  const pathToPage = joinSegments(
    args.ctx.argv.output,
    args.slug + args.ext
  );
  const dir = path.dirname(pathToPage);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pathToPage, args.content);
  return pathToPage;
};
function failConfig(message) {
  process.exitCode = 1;
  throw new Error(`ContentIndex: ${message}`);
}
function assertFields(fields) {
  if (!fields || Object.keys(fields).length === 0) {
    failConfig(
      "options.fields is required and must declare the contentIndex.json fields"
    );
  }
  for (const [name, spec] of Object.entries(fields)) {
    if (!spec || typeof spec !== "object" || typeof spec.source !== "string") {
      failConfig(`field "${name}" must have a string source`);
    }
    if (!isSupportedSource(spec.source)) {
      failConfig(
        `field "${name}" uses unsupported source "${spec.source}". Supported roots: data, frontmatter, computed`
      );
    }
  }
  return fields;
}
function isSupportedSource(source) {
  return source === "data" || source.startsWith("data.") || source === "frontmatter" || source.startsWith("frontmatter.") || source === "computed" || source.startsWith("computed.");
}
function getPath(source, pathSegments) {
  let value = source;
  for (const segment of pathSegments) {
    if (value === null || typeof value !== "object") return void 0;
    value = value[segment];
  }
  return value;
}
function resolveSource(source, data, frontmatter, computed) {
  const [root, ...pathSegments] = source.split(".");
  if (root === "data")
    return pathSegments.length === 0 ? data : getPath(data, pathSegments);
  if (root === "frontmatter") {
    return pathSegments.length === 0 ? frontmatter : getPath(frontmatter, pathSegments);
  }
  if (root === "computed") {
    return pathSegments.length === 0 ? computed : getPath(computed, pathSegments);
  }
  return void 0;
}
function toJsonValue(fieldName, value) {
  if (value === void 0) return void 0;
  try {
    JSON.stringify(value);
  } catch {
    failConfig(
      `field "${fieldName}" resolved to a non-JSON-serializable value`
    );
  }
  return value;
}
function buildIndexEntry(fields, data, frontmatter, computed) {
  const entry = {};
  for (const [name, spec] of Object.entries(fields)) {
    const resolved = resolveSource(spec.source, data, frontmatter, computed);
    const value = resolved === void 0 ? spec.default : resolved;
    if (value === void 0) continue;
    entry[name] = toJsonValue(name, value);
  }
  return entry;
}
async function computeRichContent(options, isEncrypted, tree) {
  if (!options.rssFullHtml || isEncrypted) return void 0;
  const { toHtml } = await import("hast-util-to-html");
  return escapeHTML(toHtml(tree, { allowDangerousHtml: true }));
}
function normalizePathSegment(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/^content\//i, "").toLowerCase();
}
function isInFolder(filePath, folder) {
  const normalizedPath = normalizePathSegment(filePath);
  const normalizedFolder = normalizePathSegment(folder);
  return normalizedPath === normalizedFolder || normalizedPath.startsWith(`${normalizedFolder}/`);
}
function stableGuidFromFilePath(filePath) {
  const fileName = filePath.split("/").at(-1) ?? filePath;
  return createHash("sha256").update(fileName).digest("hex");
}
function absolutizeUrl(rawUrl, pageUrl) {
  if (rawUrl === "" || rawUrl.startsWith("#") || rawUrl.startsWith("mailto:") || rawUrl.startsWith("tel:") || rawUrl.startsWith("javascript:") || rawUrl.startsWith("data:")) {
    return rawUrl;
  }
  try {
    return new URL(rawUrl, pageUrl).toString();
  } catch {
    return rawUrl;
  }
}
function absolutizeSrcSet(srcset, pageUrl) {
  return srcset.split(",").map((candidate) => candidate.trim()).filter((candidate) => candidate.length > 0).map((candidate) => {
    const [urlPart, ...descriptorParts] = candidate.split(/\s+/);
    return [absolutizeUrl(urlPart, pageUrl), ...descriptorParts].join(" ");
  }).join(", ");
}
async function renderRssHtml(rawTree, pageUrl) {
  const tree = structuredClone(rawTree);
  visit(tree, "element", (node) => {
    const properties = node.properties;
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
function rssGuid(mode, base, slug, filePath) {
  if (mode === "file-basename-hash") return stableGuidFromFilePath(filePath);
  return `https://${joinSegments(base, encodeURI(slug))}`;
}
function generateSiteMap(cfg, idx) {
  const base = cfg.baseUrl ?? "";
  const createURLEntry = (slug, content) => `<url>
    <loc>https://${joinSegments(base, encodeURI(slug))}</loc>
    ${content.lastModified && `<lastmod>${content.lastModified.toISOString()}</lastmod>`}
  </url>`;
  const urls = Array.from(idx).map(
    ([slug, content]) => createURLEntry(simplifySlug(slug), content)
  ).join("");
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}
function generateRSSFeed(cfg, entries, options, limit) {
  const base = cfg.baseUrl ?? "";
  const pageTitle = cfg.pageTitle ?? "";
  const recentNotesText = options.rssRecentNotesText ?? "Recent notes";
  const lastFewNotesText = options.rssLastFewNotesText ?? ((count) => `Last ${count} notes`);
  const createURLEntry = (entry) => `<item>
    <title>${escapeHTML(entry.title)}</title>
    <link>https://${joinSegments(base, encodeURI(simplifySlug(entry.slug)))}</link>
    <guid isPermaLink="false">${entry.guid}</guid>
    <description><![CDATA[ ${entry.richContent ?? entry.description} ]]></description>
    <pubDate>${entry.date?.toUTCString()}</pubDate>
  </item>`;
  const items = entries.sort((f1, f2) => {
    if (f1.date && f2.date) return f2.date.getTime() - f1.date.getTime();
    if (f1.date && !f2.date) return -1;
    if (!f1.date && f2.date) return 1;
    return f1.title.localeCompare(f2.title);
  }).slice(0, limit ?? entries.length).map(createURLEntry).join("");
  const description = `${limit ? lastFewNotesText(limit) : recentNotesText} on ${escapeHTML(pageTitle)}`;
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
var OttonContentIndex = (opts) => {
  const options = { ...defaultOptions, ...opts };
  const emitAll = async (ctx, content) => {
    const fields = assertFields(options.fields);
    const cfg = ctx.cfg.configuration;
    const linkIndex = /* @__PURE__ */ new Map();
    const indexEntries = {};
    const rssEntries = [];
    for (const [tree, file] of content) {
      const data = file.data ?? {};
      if (data.unlisted === true) continue;
      const slug = data.slug;
      const pluginData = data;
      const date = getDate(pluginData) ?? /* @__PURE__ */ new Date();
      const text = data.text;
      const frontmatter = data.frontmatter ?? {};
      const isEncrypted = data.encrypted === true;
      const rawFilePath = data.relativePath ?? data.filePath;
      const filePath = typeof rawFilePath === "string" ? rawFilePath : "";
      const details = {
        slug,
        filePath,
        title: frontmatter.title ?? "",
        links: data.links ?? [],
        tags: frontmatter.tags ?? [],
        content: text ?? "",
        date,
        lastModified: pluginData.dates?.modified,
        description: data.description ?? ""
      };
      if (options.includeEmptyFiles || text && text !== "") {
        const richContent = await computeRichContent(
          options,
          isEncrypted,
          tree
        );
        linkIndex.set(slug, details);
        indexEntries[slug] = buildIndexEntry(fields, data, frontmatter, {
          richContent
        });
      }
      const rssIncludesEmptyFiles = options.rssIncludeEmptyFiles ?? options.includeEmptyFiles;
      const isRssFolder = !options.rssFolder || filePath !== "" && isInFolder(filePath, options.rssFolder);
      const isRssContent = rssIncludesEmptyFiles || text && text !== "";
      if (options.enableRSS && filePath !== "" && isRssFolder && isRssContent) {
        const simpleSlug = simplifySlug(slug);
        const pageUrl = `https://${joinSegments(
          cfg.baseUrl ?? "example.com",
          encodeURI(simpleSlug)
        )}`;
        rssEntries.push({
          ...details,
          guid: rssGuid(
            options.rssGuid,
            cfg.baseUrl ?? "",
            simpleSlug,
            filePath
          ),
          richContent: options.rssFullHtml && !isEncrypted ? await renderRssHtml(tree, pageUrl) : void 0
        });
      }
    }
    const outputs = [];
    if (options.enableSiteMap) {
      outputs.push(
        await write({
          ctx,
          content: generateSiteMap(cfg, linkIndex),
          slug: "sitemap",
          ext: ".xml"
        })
      );
    }
    if (options.enableRSS) {
      outputs.push(
        await write({
          ctx,
          content: generateRSSFeed(cfg, rssEntries, options, options.rssLimit),
          slug: options.rssSlug ?? "index",
          ext: ".xml"
        })
      );
    }
    outputs.push(
      await write({
        ctx,
        content: JSON.stringify(indexEntries),
        slug: joinSegments("static", "contentIndex"),
        ext: ".json"
      })
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
              `${options.rssSlug}.xml`
            )}`
          })
        ]
      };
    }
  };
};
var index_default = OttonContentIndex;
export {
  OttonContentIndex,
  index_default as default
};
