/** @jsx h */
import type { Root } from "hast";
import { h, type ComponentChildren } from "preact";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import { slugTag } from "@quartz-community/utils";
import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  QuartzPluginData,
  SortFn,
} from "@quartz-community/types";
import { OttonPageList } from "./PageList.js";
import { listPageStyle } from "./listPageStyle.js";

export interface OttonFolderContentOptions {
  showFolderCount?: boolean;
  showSubfolders?: boolean;
  sort: SortFn;
}

type PageEntry = QuartzPluginData & Record<string, unknown>;

interface TrieNode {
  isFolder: boolean;
  children: TrieNode[];
  data: PageEntry | null;
  slug: string;
  displayName: string;
  findNode(path: string[]): TrieNode | undefined;
}

function isListed(page: PageEntry): boolean {
  return page.unlisted !== true;
}

function mostRecentDates(entries: PageEntry[]): PageEntry["dates"] {
  let dates: PageEntry["dates"] | undefined;

  for (const entry of entries) {
    if (!entry.dates) continue;
    if (!dates) {
      dates = { ...entry.dates };
      continue;
    }

    if (entry.dates.created > dates.created)
      dates.created = entry.dates.created;
    if (entry.dates.modified > dates.modified)
      dates.modified = entry.dates.modified;
    if (entry.dates.published > dates.published)
      dates.published = entry.dates.published;
  }

  return (
    dates ?? {
      created: new Date(),
      modified: new Date(),
      published: new Date(),
    }
  );
}

function syntheticFolderDates(entries: PageEntry[]) {
  return {
    dates: mostRecentDates(entries),
    defaultDateType:
      entries.find((entry) => entry.dates && entry.defaultDateType)
        ?.defaultDateType ?? "created",
  };
}

function pagesFromTrie(folder: TrieNode, showSubfolders: boolean): PageEntry[] {
  return folder.children
    .map((node) => {
      if (node.data) return isListed(node.data) ? node.data : undefined;
      if (!node.isFolder || !showSubfolders) return undefined;

      const children = node.children
        .map((child) => child.data)
        .filter((page): page is PageEntry => page !== null && isListed(page));

      return {
        slug: node.slug as FullSlug,
        ...syntheticFolderDates(children),
        frontmatter: { title: node.displayName, tags: [] },
      } as PageEntry;
    })
    .filter((page): page is PageEntry => page !== undefined);
}

export function pagesFromAllFiles(
  allFiles: PageEntry[],
  folderSlug: string,
  showSubfolders: boolean,
): PageEntry[] {
  const folderPrefix = folderSlug.endsWith("/index")
    ? folderSlug.slice(0, -"index".length)
    : folderSlug.endsWith("/")
      ? folderSlug
      : `${folderSlug}/`;
  const directChildren: PageEntry[] = [];
  const subfolderFiles = new Map<string, PageEntry[]>();

  for (const file of allFiles) {
    if (!isListed(file) || !file.slug?.startsWith(folderPrefix)) continue;

    const relativePath = file.slug.slice(folderPrefix.length);
    if (!relativePath || relativePath === "index") continue;

    const segments = relativePath.split("/");
    if (segments.length === 1) {
      directChildren.push(file);
    } else if (showSubfolders) {
      const subfolderName = segments[0]!;
      const files = subfolderFiles.get(subfolderName) ?? [];
      files.push(file);
      subfolderFiles.set(subfolderName, files);
    }
  }

  for (const [subfolderName, files] of subfolderFiles) {
    const indexFile = files.find(
      (file) => file.slug === `${folderPrefix}${subfolderName}/index`,
    );
    if (indexFile) {
      directChildren.push(indexFile);
      continue;
    }

    directChildren.push({
      slug: `${folderPrefix}${subfolderName}/index` as FullSlug,
      ...syntheticFolderDates(files),
      frontmatter: { title: subfolderName, tags: [] },
    } as PageEntry);
  }

  return directChildren;
}

export function normalizeIncludeTags(includeField: unknown): string[] {
  if (includeField === null || includeField === undefined) return [];

  const values = Array.isArray(includeField) ? includeField : [includeField];
  const tags = values
    .flatMap((value) =>
      value === null || value === undefined ? [] : String(value).split(","),
    )
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(slugTag);

  return [...new Set(tags)];
}

function normalizedPageTags(page: PageEntry): string[] {
  const tags = page.frontmatter?.tags;
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map(slugTag);
}

export function mergeIncludedPages(
  pagesInFolder: PageEntry[],
  allFiles: PageEntry[],
  currentSlug: string,
  includeField: unknown,
): PageEntry[] {
  const includeTags = new Set(normalizeIncludeTags(includeField));
  if (includeTags.size === 0) return [...pagesInFolder];

  const result = [...pagesInFolder];
  const seenSlugs = new Set(
    pagesInFolder
      .map((page) => page.slug)
      .filter((slug): slug is FullSlug => typeof slug === "string"),
  );
  seenSlugs.add(currentSlug as FullSlug);

  for (const page of allFiles) {
    const slug = page.slug;
    if (!isListed(page) || !slug || seenSlugs.has(slug)) continue;
    if (!normalizedPageTags(page).some((tag) => includeTags.has(tag))) continue;

    seenSlugs.add(slug);
    result.push(page);
  }

  return result;
}

function itemsUnderFolder(count: number): string {
  return count === 1
    ? "1 item under this folder."
    : `${count} items under this folder.`;
}

export const OttonFolderContent = ((opts?: OttonFolderContentOptions) => {
  const showFolderCount = opts?.showFolderCount ?? true;
  const showSubfolders = opts?.showSubfolders ?? true;

  const FolderContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles } = props;
    const slug = fileData.slug;
    if (!slug) return null;

    const trie = (props.ctx as { trie?: TrieNode } | undefined)?.trie;
    const folder = trie?.findNode(slug.split("/"));
    const folderPages = folder
      ? pagesFromTrie(folder, showSubfolders)
      : pagesFromAllFiles(allFiles as PageEntry[], slug, showSubfolders);
    const pages = mergeIncludedPages(
      folderPages,
      allFiles as PageEntry[],
      slug,
      fileData.frontmatter?.include,
    );
    const cssClasses = Array.isArray(fileData.frontmatter?.cssclasses)
      ? fileData.frontmatter.cssclasses
      : [];
    const root = tree as Root;
    const content = (
      root.children.length === 0 ? fileData.description : htmlToJsx(root)
    ) as ComponentChildren;

    return (
      <div class="popover-hint">
        <article class={cssClasses.join(" ")}>
          <div class="markdown-preview-view markdown-rendered">{content}</div>
        </article>
        <div class="page-listing">
          {showFolderCount && <p>{itemsUnderFolder(pages.length)}</p>}
          <div>
            <OttonPageList
              {...props}
              allFiles={pages}
              sort={opts!.sort}
              dateFormat="monthYear"
            />
          </div>
        </div>
      </div>
    );
  };

  FolderContent.css = listPageStyle;
  return FolderContent;
}) satisfies QuartzComponentConstructor<OttonFolderContentOptions>;
