import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import { h } from "preact";
import modernStyle from "./styles/toc.scss";
import legacyStyle from "./styles/legacyToc.scss";
// @ts-expect-error Inline scripts are loaded as text by the plugin build.
import script from "./scripts/toc.inline.ts";
import OverflowListFactory from "./OverflowList.js";

interface Options {
  layout: "modern" | "legacy";
}
const defaultOptions: Options = { layout: "modern" };

const titleFor = (locale?: string) =>
  locale === "en-GB" || locale === "en-US"
    ? "Table of Contents"
    : "Table of Contents";

export default ((userOptions?: Partial<Options>) => {
  const layout = userOptions?.layout ?? defaultOptions.layout;
  const {
    id: tocId,
    OverflowList,
    overflowListAfterDOMLoaded,
  } = OverflowListFactory();
  const TableOfContents: QuartzComponent = (props: QuartzComponentProps) => {
    const fileData = props.fileData as Record<string, unknown>;
    if (!Array.isArray(fileData.toc) || fileData.toc.length === 0) return null;
    const entries = fileData.toc as Array<Record<string, unknown>>;
    const collapsed = fileData.collapseToc === true;
    return h(
      "div",
      { class: [props.displayClass, "toc"].filter(Boolean).join(" ") },
      h(
        "button",
        {
          type: "button",
          class: collapsed ? "collapsed toc-header" : "toc-header",
          "aria-controls": tocId,
          "aria-expanded": !collapsed,
        },
        h("h3", null, titleFor(props.cfg.locale)),
        h(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            width: 24,
            height: 24,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": 2,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            class: "fold",
            "aria-hidden": "true",
          },
          h("polyline", { points: "6 9 12 15 18 9" }),
        ),
      ),
      h(
        OverflowList,
        {
          id: tocId,
          class: collapsed ? "collapsed toc-content" : "toc-content",
          "aria-hidden": collapsed,
          hidden: collapsed,
        },
        entries.map((entry) => {
          const slug = String(entry.slug);
          return h(
            "li",
            { key: slug, class: `depth-${String(entry.depth)}` },
            h("a", { href: `#${slug}`, "data-for": slug }, String(entry.text)),
          );
        }),
      ),
    );
  };
  TableOfContents.css = layout === "modern" ? modernStyle : legacyStyle;
  TableOfContents.afterDOMLoaded = [
    script as string,
    overflowListAfterDOMLoaded as string,
  ];
  return TableOfContents;
}) satisfies QuartzComponentConstructor<Partial<Options>>;
