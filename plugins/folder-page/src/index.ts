import { FolderPage as UpstreamFolderPage } from "@quartz-community/folder-page";
import type { FolderPageOptions } from "@quartz-community/folder-page";
import type { QuartzPluginData, SortFn } from "@quartz-community/types";
import { isFolderPath } from "@quartz-community/utils";
import { OttonFolderContent } from "./FolderContent.js";

export {
  mergeIncludedPages,
  normalizeIncludeTags,
  OttonFolderContent,
  pagesFromAllFiles,
} from "./FolderContent.js";
export { descriptionMarkdownToHast, OttonPageList } from "./PageList.js";
export { listPageStyle } from "./listPageStyle.js";

type SortableNode = {
  isFolder: boolean;
  displayName: string;
};

const compareExplorerEntries = (a: SortableNode, b: SortableNode) => {
  function normalizeTitleForSort(title: string) {
    return title.replace(/^[\s\p{Extended_Pictographic}\uFE0F\u200D]+/gu, "");
  }

  function alphaCompare(left: string, right: string) {
    const base = left.localeCompare(right, undefined, { sensitivity: "base" });
    if (base !== 0) return base;
    return left.localeCompare(right, undefined, { sensitivity: "variant" });
  }

  function monthToNumber(value: string) {
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

  function toDateKey(year: number, month = 1, day = 1) {
    return year * 10000 + month * 100 + day;
  }

  function parseIsoDate(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return toDateKey(year, month, day);
  }

  function parseDateLikeString(value: string) {
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

  function extractTitleDateKey(title: string) {
    const trimmed = title.trim();

    const isoKey = parseIsoDate(trimmed);
    if (isoKey !== null) return isoKey;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) return null;

    const prefix = trimmed.slice(0, colonIndex).trim();
    if (!prefix) return null;

    return parseDateLikeString(prefix);
  }

  function buildTitleSortKey(title: string) {
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
    const diff = alphaCompare(aTitle, bTitle);
    return diff !== 0 ? diff : alphaCompare(rawATitle, rawBTitle);
  }

  const aKey = buildTitleSortKey(aTitle);
  const bKey = buildTitleSortKey(bTitle);

  if (aKey.category !== bKey.category) {
    return aKey.category === "date" ? -1 : 1;
  }

  if (aKey.category === "date" && bKey.category === "date") {
    const diff = (aKey.dateKey ?? 0) - (bKey.dateKey ?? 0);
    if (diff !== 0) return diff;
  }

  const diff = alphaCompare(aTitle, bTitle);
  return diff !== 0 ? diff : alphaCompare(rawATitle, rawBTitle);
};

export const compareExplorerListEntries: SortFn = (
  a: QuartzPluginData,
  b: QuartzPluginData,
) =>
  compareExplorerEntries(
    {
      isFolder: isFolderPath(a.slug ?? ""),
      displayName: a.frontmatter?.title ?? "",
    },
    {
      isFolder: isFolderPath(b.slug ?? ""),
      displayName: b.frontmatter?.title ?? "",
    },
  );

export const FolderPage = (opts?: FolderPageOptions) => {
  const options = {
    ...opts,
    sort: compareExplorerListEntries,
  };

  return {
    ...UpstreamFolderPage(options),
    body: () => OttonFolderContent(options),
  };
};

export default FolderPage;
