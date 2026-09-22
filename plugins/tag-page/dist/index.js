// src/index.ts
import { TagPage as UpstreamTagPage } from "@quartz-community/tag-page";

// src/sort.ts
import { isFolderPath } from "@quartz-community/utils";
var compareExplorerEntries = (a, b) => {
  function normalizeTitleForSort(title) {
    return title.replace(/^[\s\p{Extended_Pictographic}\uFE0F\u200D]+/gu, "");
  }
  function alphaCompare(left, right) {
    const base = left.localeCompare(right, void 0, { sensitivity: "base" });
    if (base !== 0) return base;
    return left.localeCompare(right, void 0, { sensitivity: "variant" });
  }
  function monthToNumber(value) {
    switch (value) {
      case "jan":
      case "january":
        return 1;
      case "feb":
      case "february":
        return 2;
      case "mar":
      case "march":
        return 3;
      case "apr":
      case "april":
        return 4;
      case "may":
        return 5;
      case "jun":
      case "june":
        return 6;
      case "jul":
      case "july":
        return 7;
      case "aug":
      case "august":
        return 8;
      case "sep":
      case "sept":
      case "september":
        return 9;
      case "oct":
      case "october":
        return 10;
      case "nov":
      case "november":
        return 11;
      case "dec":
      case "december":
        return 12;
      default:
        return null;
    }
  }
  function toDateKey(year, month = 1, day = 1) {
    return year * 1e4 + month * 100 + day;
  }
  function parseIsoDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return toDateKey(year, month, day);
  }
  function parseDateLikeString(value) {
    const trimmed = value.trim();
    const isoKey = parseIsoDate(trimmed);
    if (isoKey !== null) return isoKey;
    const rangeMatch = /^(\d{3,4})\s*-\s*(\d{2,4})$/.exec(trimmed);
    if (rangeMatch) {
      const year = Number(rangeMatch[1]);
      return Number.isFinite(year) ? toDateKey(year) : null;
    }
    const yearMatch = /^(\d{3,4})$/.exec(trimmed);
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      return Number.isFinite(year) ? toDateKey(year) : null;
    }
    const monthYearMatch = /^([A-Za-z.]+)\s+(\d{3,4})$/.exec(trimmed);
    if (monthYearMatch) {
      const monthKey = monthYearMatch[1].toLowerCase().replace(/\./g, "");
      const year = Number(monthYearMatch[2]);
      const month = monthToNumber(monthKey);
      if (month && Number.isFinite(year)) {
        return toDateKey(year, month);
      }
    }
    return null;
  }
  function extractTitleDateKey(title) {
    const trimmed = title.trim();
    const isoKey = parseIsoDate(trimmed);
    if (isoKey !== null) return isoKey;
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) return null;
    const prefix = trimmed.slice(0, colonIndex).trim();
    if (!prefix) return null;
    return parseDateLikeString(prefix);
  }
  function buildTitleSortKey(title) {
    const dateKey = extractTitleDateKey(title);
    if (dateKey !== null) {
      return { category: "date", dateKey, title };
    }
    return { category: "alpha", title };
  }
  if (a.isFolder !== b.isFolder) {
    return a.isFolder ? -1 : 1;
  }
  const rawATitle = a.displayName ?? "";
  const rawBTitle = b.displayName ?? "";
  const aTitle = normalizeTitleForSort(rawATitle);
  const bTitle = normalizeTitleForSort(rawBTitle);
  if (a.isFolder && b.isFolder) {
    const diff2 = alphaCompare(aTitle, bTitle);
    return diff2 !== 0 ? diff2 : alphaCompare(rawATitle, rawBTitle);
  }
  const aKey = buildTitleSortKey(aTitle);
  const bKey = buildTitleSortKey(bTitle);
  if (aKey.category !== bKey.category) {
    return aKey.category === "date" ? -1 : 1;
  }
  if (aKey.category === "date" && bKey.category === "date") {
    const diff2 = (aKey.dateKey ?? 0) - (bKey.dateKey ?? 0);
    if (diff2 !== 0) return diff2;
  }
  const diff = alphaCompare(aTitle, bTitle);
  return diff !== 0 ? diff : alphaCompare(rawATitle, rawBTitle);
};
var compareExplorerListEntries = (a, b) => compareExplorerEntries(
  {
    isFolder: isFolderPath(a.slug ?? ""),
    displayName: a.frontmatter?.title ?? ""
  },
  {
    isFolder: isFolderPath(b.slug ?? ""),
    displayName: b.frontmatter?.title ?? ""
  }
);

// src/TagContent.tsx
import { Fragment, h as h2 } from "preact";
import { htmlToJsx as htmlToJsx2 } from "@quartz-community/utils/jsx";
import {
  getAllSegmentPrefixes,
  resolveRelative as resolveRelative2,
  simplifySlug,
  slugTag
} from "@quartz-community/utils";

// src/PageList.tsx
import { h } from "preact";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import { getDate } from "@quartz-community/utils/sort";
import { resolveRelative } from "@quartz-community/utils";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// src/listPageStyle.ts
var listPageStyle = `
ul.section-ul {
  list-style: none;
  margin-top: 2em;
  padding-left: 0;
}

li.section-li {
  margin-bottom: 1em;
}

li.section-li > .section {
  display: grid;
  grid-template-columns: fit-content(8em) minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  align-items: start;
}

li.section-li > .section > .desc {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

li.section-li > .section > .desc > h3 {
  margin: 0;
}

li.section-li > .section > .desc > h3 > a {
  background-color: transparent;
}

li.section-li > .section > .meta {
  grid-column: 1;
  grid-row: 1;
  margin: 0 1em 0 0;
  opacity: 0.6;
}

li.section-li > .section > .description {
  grid-column: 2;
  grid-row: 2;
  margin: 0.35em 0 0;
  color: var(--gray);
  font-size: 0.95em;
  line-height: 1.4;
}

li.section-li > .section > .description + .tags {
  margin-top: 0.35em;
}

li.section-li > .section > .tags {
  grid-column: 2;
  grid-row: 3;
  margin: 0;
}

li.section-li > .section > .description p,
li.section-li > .section > .description li {
  line-height: inherit;
}

li.section-li > .section > .description > :first-child {
  margin-top: 0;
}

li.section-li > .section > .description > :last-child {
  margin-bottom: 0;
}

@media all and (max-width: 600px) {
  li.section-li > .section > .tags {
    display: none;
  }
}

.popover .section {
  grid-template-columns: fit-content(8em) 1fr !important;
}

.popover .section > .tags {
  display: none;
}
`;

// src/PageList.tsx
var descriptionProcessor = unified().use(remarkParse).use(remarkRehype);
function descriptionMarkdownToHast(value) {
  if (typeof value !== "string") return void 0;
  const markdown = value.trim();
  if (markdown.length === 0) return void 0;
  const parsed = descriptionProcessor.parse(markdown);
  return descriptionProcessor.runSync(parsed);
}
function descriptionContent(page) {
  const prepared = page.descriptionHtml;
  if (prepared?.children.length)
    return htmlToJsx(prepared);
  const parsed = descriptionMarkdownToHast(page.frontmatter?.description);
  return parsed ? htmlToJsx(parsed) : void 0;
}
function DateDisplay({
  date,
  locale,
  format = "short"
}) {
  const options = format === "monthYear" ? { year: "numeric", month: "short" } : { year: "numeric", month: "short", day: "2-digit" };
  return /* @__PURE__ */ h("time", { dateTime: date.toISOString() }, date.toLocaleDateString(locale, options));
}
var OttonPageList = ({
  cfg,
  fileData,
  allFiles,
  limit,
  sort,
  dateFormat
}) => {
  let list = [...allFiles].sort(sort);
  if (limit !== void 0) list = list.slice(0, limit);
  const fileSlug = fileData.slug;
  return /* @__PURE__ */ h("ul", { class: "section-ul" }, list.map((rawPage) => {
    const page = rawPage;
    const title = page.frontmatter?.title;
    const tags = Array.isArray(page.frontmatter?.tags) ? page.frontmatter.tags.filter(
      (tag) => typeof tag === "string"
    ) : [];
    const description = descriptionContent(page);
    const date = getDate(page);
    return /* @__PURE__ */ h("li", { class: "section-li", key: page.slug }, /* @__PURE__ */ h("div", { class: "section" }, /* @__PURE__ */ h("p", { class: "meta" }, date && /* @__PURE__ */ h(
      DateDisplay,
      {
        date,
        locale: cfg.locale ?? "en-US",
        format: dateFormat
      }
    )), /* @__PURE__ */ h("div", { class: "desc" }, /* @__PURE__ */ h("h3", null, /* @__PURE__ */ h(
      "a",
      {
        href: resolveRelative(
          fileSlug ?? "",
          page.slug
        ),
        class: "internal"
      },
      title
    ))), description && /* @__PURE__ */ h("div", { class: "description" }, description), /* @__PURE__ */ h("ul", { class: "tags" }, tags.map((tag) => /* @__PURE__ */ h("li", { key: tag }, /* @__PURE__ */ h(
      "a",
      {
        class: "internal tag-link",
        href: resolveRelative(
          fileSlug ?? "",
          `tags/${tag}`
        )
      },
      tag
    ))))));
  }));
};
OttonPageList.css = listPageStyle;

// src/TagContent.tsx
function isListed(page) {
  return page.unlisted !== true;
}
function pageTags(page) {
  const tags = page.frontmatter?.tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag) => typeof tag === "string").map(slugTag).flatMap(getAllSegmentPrefixes);
}
function itemsUnderTag(count) {
  return count === 1 ? "1 item with this tag." : `${count} items with this tag.`;
}
function descriptionContent2(page) {
  if (!page) return void 0;
  const root = page.htmlAst;
  if (root?.children.length) return htmlToJsx2(root);
  const parsed = descriptionMarkdownToHast(page.frontmatter?.description);
  if (parsed) return htmlToJsx2(parsed);
  return page.description;
}
var OttonTagContent = ((opts) => {
  const numPages = opts?.numPages ?? 10;
  const TagContent = (props) => {
    const { tree, fileData, allFiles, cfg } = props;
    const pageData = fileData;
    const slug = pageData.slug;
    if (!(slug?.startsWith("tags/") || slug === "tags")) {
      throw new Error(
        `Component "TagContent" tried to render a non-tag page: ${slug}`
      );
    }
    const tag = simplifySlug(slug.slice("tags/".length));
    const listedFiles = allFiles.filter(isListed);
    const allPagesWithTag = (value) => listedFiles.filter((file) => pageTags(file).includes(value));
    const root = tree;
    const content = root.children.length === 0 ? pageData.description : htmlToJsx2(root);
    const cssClasses = Array.isArray(pageData.frontmatter?.cssclasses) ? pageData.frontmatter.cssclasses : [];
    if (tag === "/") {
      const tags = [...new Set(listedFiles.flatMap(pageTags))].sort(
        (a, b) => a.localeCompare(b)
      );
      return /* @__PURE__ */ h2("div", { class: "popover-hint" }, /* @__PURE__ */ h2("article", { class: cssClasses.join(" ") }, /* @__PURE__ */ h2("div", { class: "markdown-preview-view markdown-rendered" }, /* @__PURE__ */ h2("p", null, content))), /* @__PURE__ */ h2("p", null, `Found ${tags.length} total tags.`), /* @__PURE__ */ h2("div", null, tags.map((listedTag) => {
        const pages2 = allPagesWithTag(listedTag);
        const contentPage = listedFiles.find(
          (file) => file.slug === `tags/${listedTag}`
        );
        const description = descriptionContent2(contentPage);
        const href = resolveRelative2(
          slug,
          `/tags/${listedTag}`
        );
        return /* @__PURE__ */ h2("div", { key: listedTag }, /* @__PURE__ */ h2("h2", null, /* @__PURE__ */ h2("a", { class: "internal tag-link", href }, listedTag)), description && /* @__PURE__ */ h2("p", null, description), /* @__PURE__ */ h2("div", { class: "page-listing" }, /* @__PURE__ */ h2("p", null, itemsUnderTag(pages2.length), pages2.length > numPages && /* @__PURE__ */ h2(Fragment, null, " ", `Showing first ${numPages} tags.`)), /* @__PURE__ */ h2(
          OttonPageList,
          {
            ...props,
            allFiles: pages2,
            limit: numPages,
            sort: opts.sort
          }
        )));
      })));
    }
    const pages = allPagesWithTag(tag);
    return /* @__PURE__ */ h2("div", { class: "popover-hint" }, /* @__PURE__ */ h2("article", { class: cssClasses.join(" ") }, /* @__PURE__ */ h2("div", { class: "markdown-preview-view markdown-rendered" }, content)), /* @__PURE__ */ h2("div", { class: "page-listing" }, /* @__PURE__ */ h2("p", null, itemsUnderTag(pages.length)), /* @__PURE__ */ h2("div", null, /* @__PURE__ */ h2(OttonPageList, { ...props, allFiles: pages, sort: opts.sort }))));
  };
  TagContent.css = listPageStyle;
  return TagContent;
});

// src/index.ts
var TagPage = (opts) => {
  const options = {
    ...opts,
    sort: compareExplorerListEntries
  };
  return {
    ...UpstreamTagPage(options),
    body: () => OttonTagContent(options)
  };
};
var index_default = TagPage;
export {
  OttonTagContent,
  TagPage,
  compareExplorerListEntries,
  index_default as default
};
