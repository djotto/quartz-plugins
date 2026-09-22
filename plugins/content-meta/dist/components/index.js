// src/components/index.tsx
import { h } from "preact";
var defaultOptions = {
  showReadingTime: true
};
var style = `
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
  content: "\xB7";
  margin: 0 0.4rem;
  color: var(--gray);
}

.content-meta .meta-label {
  color: var(--gray);
  font-weight: 500;
  margin-right: 0.4rem;
}
`;
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
function formatMonthYear(date, locale = "en-US") {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short"
  });
}
function readingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
function readingTimeLabel(minutes) {
  return `${minutes} min read`;
}
var ContentMeta = (opts) => {
  const options = { ...defaultOptions, ...opts };
  function ContentMetadata({
    cfg,
    fileData,
    displayClass
  }) {
    const text = typeof fileData.text === "string" ? fileData.text : "";
    if (!text) return null;
    const segments = [];
    const created = fileData.dates?.created;
    const modified = fileData.dates?.modified;
    const sameMonthYear = created && modified && created.getFullYear() === modified.getFullYear() && created.getMonth() === modified.getMonth();
    if (created) {
      segments.push(
        h("span", {}, [
          h("span", { class: "meta-label" }, "Created"),
          h(
            "time",
            { datetime: created.toISOString() },
            formatMonthYear(created, cfg.locale)
          )
        ])
      );
    }
    if (modified && !sameMonthYear) {
      segments.push(
        h("span", {}, [
          h("span", { class: "meta-label" }, "Last updated"),
          h(
            "time",
            { datetime: modified.toISOString() },
            formatMonthYear(modified, cfg.locale)
          )
        ])
      );
    }
    if (options.showReadingTime) {
      segments.push(h("span", {}, readingTimeLabel(readingTime(text))));
    }
    if (segments.length === 0) return null;
    return h(
      "p",
      { class: classNames(displayClass, "content-meta") },
      segments
    );
  }
  ContentMetadata.css = style;
  return ContentMetadata;
};
var index_default = ContentMeta;
export {
  ContentMeta,
  index_default as default
};
