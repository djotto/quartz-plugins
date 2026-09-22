/** @jsx h */
import type { Root } from "hast";
import { h, type ComponentChildren } from "preact";
import { htmlToJsx } from "@quartz-community/utils/jsx";
import { getDate } from "@quartz-community/utils/sort";
import { resolveRelative } from "@quartz-community/utils";
import type {
  FullSlug,
  QuartzComponentProps,
  QuartzPluginData,
  SortFn,
} from "@quartz-community/types";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { listPageStyle } from "./listPageStyle.js";

export type DateFormat = "short" | "monthYear";

type PageEntry = QuartzPluginData & Record<string, unknown>;

type PageListProps = {
  limit?: number;
  sort: SortFn;
  dateFormat?: DateFormat;
} & QuartzComponentProps;

const descriptionProcessor = unified().use(remarkParse).use(remarkRehype);

export function descriptionMarkdownToHast(value: unknown): Root | undefined {
  if (typeof value !== "string") return undefined;

  const markdown = value.trim();
  if (markdown.length === 0) return undefined;

  const parsed = descriptionProcessor.parse(markdown);
  return descriptionProcessor.runSync(parsed) as Root;
}

function descriptionContent(page: PageEntry): ComponentChildren | undefined {
  const prepared = page.descriptionHtml as Root | undefined;
  if (prepared?.children.length)
    return htmlToJsx(prepared) as ComponentChildren;

  const parsed = descriptionMarkdownToHast(page.frontmatter?.description);
  return parsed ? (htmlToJsx(parsed) as ComponentChildren) : undefined;
}

function DateDisplay({
  date,
  locale,
  format = "short",
}: {
  date: Date;
  locale: string;
  format?: DateFormat;
}) {
  const options: Intl.DateTimeFormatOptions =
    format === "monthYear"
      ? { year: "numeric", month: "short" }
      : { year: "numeric", month: "short", day: "2-digit" };

  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleDateString(locale, options)}
    </time>
  );
}

export const OttonPageList = ({
  cfg,
  fileData,
  allFiles,
  limit,
  sort,
  dateFormat,
}: PageListProps) => {
  let list = [...allFiles].sort(sort);
  if (limit !== undefined) list = list.slice(0, limit);

  const fileSlug = fileData.slug as FullSlug | undefined;

  return (
    <ul class="section-ul">
      {list.map((rawPage) => {
        const page = rawPage as PageEntry;
        const title = page.frontmatter?.title;
        const tags = Array.isArray(page.frontmatter?.tags)
          ? page.frontmatter.tags.filter(
              (tag): tag is string => typeof tag === "string",
            )
          : [];
        const description = descriptionContent(page);
        const date = getDate(page);

        return (
          <li class="section-li" key={page.slug}>
            <div class="section">
              <p class="meta">
                {date && (
                  <DateDisplay
                    date={date}
                    locale={cfg.locale ?? "en-US"}
                    format={dateFormat}
                  />
                )}
              </p>
              <div class="desc">
                <h3>
                  <a
                    href={resolveRelative(
                      fileSlug ?? ("" as FullSlug),
                      page.slug as FullSlug,
                    )}
                    class="internal"
                  >
                    {title}
                  </a>
                </h3>
              </div>
              {description && <div class="description">{description}</div>}
              <ul class="tags">
                {tags.map((tag) => (
                  <li key={tag}>
                    <a
                      class="internal tag-link"
                      href={resolveRelative(
                        fileSlug ?? ("" as FullSlug),
                        `tags/${tag}` as FullSlug,
                      )}
                    >
                      {tag}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

OttonPageList.css = listPageStyle;
