/** @jsx h */
/** @jsxFrag Fragment */
import type { Root } from "hast";
import { Fragment, h, type ComponentChildren } from "preact";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import {
  getAllSegmentPrefixes,
  resolveRelative,
  simplifySlug,
  slugTag,
} from "@quartz-community/utils";
import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  QuartzPluginData,
  SortFn,
} from "@quartz-community/types";
import { descriptionMarkdownToHast, OttonPageList } from "./PageList.js";
import { listPageStyle } from "./listPageStyle.js";

export interface OttonTagContentOptions {
  sort: SortFn;
  numPages?: number;
}

type PageEntry = QuartzPluginData & Record<string, unknown>;

function isListed(page: PageEntry): boolean {
  return page.unlisted !== true;
}

function pageTags(page: PageEntry): string[] {
  const tags = page.frontmatter?.tags;
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map(slugTag)
    .flatMap(getAllSegmentPrefixes);
}

function itemsUnderTag(count: number): string {
  return count === 1
    ? "1 item with this tag."
    : `${count} items with this tag.`;
}

function descriptionContent(
  page: PageEntry | undefined,
): ComponentChildren | undefined {
  if (!page) return undefined;

  const root = page.htmlAst as Root | undefined;
  if (root?.children.length) return htmlToJsx(root) as ComponentChildren;

  const parsed = descriptionMarkdownToHast(page.frontmatter?.description);
  if (parsed) return htmlToJsx(parsed) as ComponentChildren;

  return page.description;
}

export const OttonTagContent = ((opts?: OttonTagContentOptions) => {
  const numPages = opts?.numPages ?? 10;

  const TagContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props;
    const pageData = fileData as PageEntry;
    const slug = pageData.slug;

    if (!(slug?.startsWith("tags/") || slug === "tags")) {
      throw new Error(
        `Component "TagContent" tried to render a non-tag page: ${slug}`,
      );
    }

    const tag = simplifySlug(slug.slice("tags/".length) as FullSlug);
    const listedFiles = (allFiles as PageEntry[]).filter(isListed);
    const allPagesWithTag = (value: string) =>
      listedFiles.filter((file) => pageTags(file).includes(value));
    const root = tree as Root;
    const content = (
      root.children.length === 0 ? pageData.description : htmlToJsx(root)
    ) as ComponentChildren;
    const cssClasses = Array.isArray(pageData.frontmatter?.cssclasses)
      ? pageData.frontmatter.cssclasses
      : [];

    if (tag === "/") {
      const tags = [...new Set(listedFiles.flatMap(pageTags))].sort((a, b) =>
        a.localeCompare(b),
      );

      return (
        <div class="popover-hint">
          <article class={cssClasses.join(" ")}>
            <div class="markdown-preview-view markdown-rendered">
              <p>{content}</p>
            </div>
          </article>
          <p>{`Found ${tags.length} total tags.`}</p>
          <div>
            {tags.map((listedTag) => {
              const pages = allPagesWithTag(listedTag);
              const contentPage = listedFiles.find(
                (file) => file.slug === `tags/${listedTag}`,
              );
              const description = descriptionContent(contentPage);
              const href = resolveRelative(
                slug,
                `/tags/${listedTag}` as FullSlug,
              );

              return (
                <div key={listedTag}>
                  <h2>
                    <a class="internal tag-link" href={href}>
                      {listedTag}
                    </a>
                  </h2>
                  {description && <p>{description as ComponentChildren}</p>}
                  <div class="page-listing">
                    <p>
                      {itemsUnderTag(pages.length)}
                      {pages.length > numPages && (
                        <> {`Showing first ${numPages} tags.`}</>
                      )}
                    </p>
                    <OttonPageList
                      {...props}
                      allFiles={pages}
                      limit={numPages}
                      sort={opts!.sort}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const pages = allPagesWithTag(tag);
    return (
      <div class="popover-hint">
        <article class={cssClasses.join(" ")}>
          <div class="markdown-preview-view markdown-rendered">{content}</div>
        </article>
        <div class="page-listing">
          <p>{itemsUnderTag(pages.length)}</p>
          <div>
            <OttonPageList {...props} allFiles={pages} sort={opts!.sort} />
          </div>
        </div>
      </div>
    );
  };

  TagContent.css = listPageStyle;
  return TagContent;
}) satisfies QuartzComponentConstructor<OttonTagContentOptions>;
