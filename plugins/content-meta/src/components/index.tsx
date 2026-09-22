import type {
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import { h } from "preact";

interface ContentMetaOptions {
  showReadingTime: boolean;
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
};

const style = `
.content-meta {
  margin-top: 0;
  color: var(--darkgray);
  font-size: 0.85rem;
}

.content-meta > span {
  display: inline-flex;
  align-items: baseline;
}

.content-meta > * + *::before {
  content: "·";
  margin: 0 0.4rem;
  color: var(--gray);
}

.content-meta .meta-label {
  color: var(--gray);
  font-weight: 500;
  margin-right: 0.4rem;
}
`;

function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatMonthYear(date: Date, locale = "en-US") {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
  });
}

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function readingTimeLabel(minutes: number) {
  return `${minutes} min read`;
}

export const ContentMeta: QuartzComponentConstructor<
  Partial<ContentMetaOptions>
> = (opts) => {
  const options = { ...defaultOptions, ...opts };

  function ContentMetadata({
    cfg,
    fileData,
    displayClass,
  }: QuartzComponentProps) {
    const text = typeof fileData.text === "string" ? fileData.text : "";
    if (!text) return null;

    const segments = [];
    const created = fileData.dates?.created;
    const modified = fileData.dates?.modified;
    const sameMonthYear =
      created &&
      modified &&
      created.getFullYear() === modified.getFullYear() &&
      created.getMonth() === modified.getMonth();

    if (created) {
      segments.push(
        h("span", {}, [
          h("span", { class: "meta-label" }, "Created"),
          h(
            "time",
            { datetime: created.toISOString() },
            formatMonthYear(created, cfg.locale),
          ),
        ]),
      );
    }

    if (modified && !sameMonthYear) {
      segments.push(
        h("span", {}, [
          h("span", { class: "meta-label" }, "Last updated"),
          h(
            "time",
            { datetime: modified.toISOString() },
            formatMonthYear(modified, cfg.locale),
          ),
        ]),
      );
    }

    if (options.showReadingTime) {
      segments.push(h("span", {}, readingTimeLabel(readingTime(text))));
    }

    if (segments.length === 0) return null;

    return h(
      "p",
      { class: classNames(displayClass, "content-meta") },
      segments,
    );
  }

  ContentMetadata.css = style;
  return ContentMetadata;
};

export default ContentMeta;
