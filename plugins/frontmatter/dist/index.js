// src/index.ts
import {
  getFileExtension,
  slugTag,
  slugifyFilePath
} from "@quartz-community/utils/path";
import { parse } from "yaml";
function findYamlFrontmatter(source, delimiters) {
  const [opening, closing] = Array.isArray(delimiters) ? delimiters : [delimiters, delimiters];
  if (opening !== "---" || closing !== "---") return void 0;
  const openingMatch = /^(?:\uFEFF)?---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!openingMatch) return void 0;
  const bodyStart = openingMatch[0].length;
  const closingMatch = /^---[ \t]*(?:\r?\n|$)/gm;
  closingMatch.lastIndex = bodyStart;
  const match = closingMatch.exec(source);
  if (!match) return void 0;
  return {
    content: source.slice(bodyStart, match.index),
    endOffset: match.index + match[0].length
  };
}
function coalesce(data, keys) {
  for (const key of keys) {
    if (data[key] !== void 0 && data[key] !== null) return data[key];
  }
  return void 0;
}
function coerceArray(value) {
  if (value === void 0 || value === null) return void 0;
  if (!Array.isArray(value))
    return String(value).split(",").map((item) => item.trim());
  return value.filter(
    (item) => typeof item === "string" || typeof item === "number"
  ).map(String);
}
function aliasSlugs(aliases) {
  return aliases.map((alias) => {
    const path = getFileExtension(alias) === ".md" ? alias : `${alias}.md`;
    return slugifyFilePath(path);
  });
}
function normalizeMetadata(data, file, ctx) {
  data.title = data.title != null && String(data.title) !== "" ? String(data.title) : file.stem ?? "Untitled";
  const tags = coerceArray(coalesce(data, ["tags", "tag"]));
  if (tags) data.tags = [...new Set(tags.map((tag) => slugTag(tag)))];
  const aliases = coerceArray(coalesce(data, ["aliases", "alias"]));
  if (aliases) {
    data.aliases = aliases;
    file.data.aliases = aliasSlugs(aliases);
    ctx.allSlugs.push(...file.data.aliases);
  }
  if (data.permalink != null && String(data.permalink) !== "") {
    const permalink = String(data.permalink);
    data.permalink = permalink;
    file.data.aliases = [
      ...file.data.aliases ?? [],
      permalink
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
    "last-modified"
  ]);
  if (modified) data.modified = modified;
  data.modified ||= created;
  const published = coalesce(data, ["published", "publishDate", "date"]);
  if (published) data.published = published;
  const socialImage = coalesce(data, ["socialImage", "image", "cover"]);
  if (socialImage) data.socialImage = socialImage;
  ctx.allSlugs.splice(0, ctx.allSlugs.length, ...new Set(ctx.allSlugs));
  file.data.frontmatter = data;
}
function stripFrontmatter(tree, endOffset) {
  tree.children = tree.children.filter((node) => {
    const start = node.position?.start.offset;
    return start === void 0 || start >= endOffset;
  });
}
var OttonFrontmatter = (options) => ({
  name: "OttonFrontmatter",
  markdownPlugins(ctx) {
    const delimiters = options?.delimiters ?? "---";
    return [
      () => (tree, file) => {
        const source = typeof file.value === "string" ? file.value : Buffer.from(file.value).toString();
        const block = findYamlFrontmatter(source, delimiters);
        let data = {};
        if (block) {
          const parsed = parse(block.content);
          data = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
          stripFrontmatter(
            tree,
            block.endOffset - (source.startsWith("\uFEFF") ? 1 : 0)
          );
        }
        normalizeMetadata(data, file, ctx);
      }
    ];
  }
});
var FrontMatter = OttonFrontmatter;
var index_default = OttonFrontmatter;
export {
  FrontMatter,
  OttonFrontmatter,
  index_default as default
};
