import { mapStyles } from "./styles.js";
// The build loads this browser entry as bundled JavaScript text.
// @ts-expect-error esbuild supplies the default string export.
import mapScript from "./runtime/map.inline.ts";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { Root, Element, Text, Parent } from "hast";
import { visit } from "unist-util-visit";

type Node = Element | Text;

type MapDirectiveOptionKey =
  "alpha" | "hexbin" | "hulls" | "legend" | "points" | "heatmap";
type MapDirectiveOptions = Record<MapDirectiveOptionKey, boolean>;
type MapDirectiveParseResult =
  | { matched: false }
  | { matched: true; options: MapDirectiveOptions; error?: string };

export interface OttonMapOptions {
  cartoBasemapsApiKey: string;
}

const directiveRegex = /^\s*\{\{map(?:\s+([^}]+?))?\}\}\s*/i;
const defaultMapDirectiveOptions: MapDirectiveOptions = {
  alpha: false,
  hexbin: false,
  hulls: true,
  legend: true,
  points: true,
  heatmap: false,
};

function isParagraph(node: unknown): node is Element {
  return (
    (node as Element | undefined)?.type === "element" &&
    (node as Element).tagName === "p"
  );
}

function splitLines(nodes: Node[]): Node[][] {
  const lines: Node[][] = [[]];
  nodes.forEach((child) => {
    if (child.type === "element" && child.tagName === "br") {
      lines.push([]);
      return;
    }
    lines[lines.length - 1].push(child);
  });
  return lines;
}

function isBlankLine(nodes: Node[]): boolean {
  return nodes.every(
    (child) => child.type === "text" && child.value.trim().length === 0,
  );
}

function firstText(nodes: Node[]): Text | undefined {
  return nodes.find((child): child is Text => child.type === "text");
}

function parseDirectiveOptionKey(value: string): MapDirectiveOptionKey | null {
  if (
    value === "alpha" ||
    value === "hexbin" ||
    value === "hulls" ||
    value === "legend" ||
    value === "points" ||
    value === "heatmap"
  ) {
    return value;
  }
  return null;
}

function parseBooleanDirectiveOption(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (["on", "true", "1", "yes"].includes(normalized)) return true;
  if (["off", "false", "0", "no"].includes(normalized)) return false;
  return undefined;
}

function parseMapDirective(nodes: Node[]): MapDirectiveParseResult {
  const text = firstText(nodes);
  if (!text) return { matched: false };
  const match = text.value.match(directiveRegex);
  if (!match) return { matched: false };

  const options: MapDirectiveOptions = { ...defaultMapDirectiveOptions };
  const optionText = (match[1] ?? "").trim();
  if (optionText) {
    const tokens = optionText.split(/\s+/);
    for (const token of tokens) {
      const eqIndex = token.indexOf("=");
      if (eqIndex <= 0 || eqIndex === token.length - 1) {
        return {
          matched: true,
          options,
          error: `Invalid map option '${token}'. Expected key=value (for example: hulls=off).`,
        };
      }

      const keyText = token.slice(0, eqIndex).toLowerCase();
      const valueText = token.slice(eqIndex + 1);
      const key = parseDirectiveOptionKey(keyText);
      if (!key) {
        return {
          matched: true,
          options,
          error: `Unknown map option '${keyText}'. Supported options are: alpha, hexbin, hulls, legend, points, heatmap.`,
        };
      }

      const parsedValue = parseBooleanDirectiveOption(valueText);
      if (typeof parsedValue !== "boolean") {
        return {
          matched: true,
          options,
          error: `Invalid value '${valueText}' for map option '${key}'. Use on/off (or true/false).`,
        };
      }

      options[key] = parsedValue;
    }
  }

  text.value = text.value.replace(directiveRegex, "");
  return { matched: true, options };
}

function hasRenderableCaption(nodes: Node[]): boolean {
  return nodes.some((child) => {
    if (child.type === "element") return true;
    return child.value.trim().length > 0;
  });
}

function textContent(node: Node): string {
  if (node.type === "text") return node.value;
  return (node.children as Node[]).map(textContent).join("");
}

function extractUrlFromNodes(nodes: Node[]): string | undefined {
  let url: string | undefined;

  for (const child of nodes) {
    if (child.type === "text") {
      const value = child.value.trim();
      if (value.length === 0) continue;
      if (url) return undefined;
      if (/\s/.test(value)) return undefined;
      url = value;
      continue;
    }

    if (child.tagName !== "a") return undefined;
    if (url) return undefined;

    const href = child.properties?.href;
    if (typeof href !== "string" || href.trim().length === 0) return undefined;

    const label = textContent(child).trim();
    if (label.length > 0 && /\s/.test(label)) {
      return undefined;
    }

    url = href.trim();
  }

  return url;
}

function extractUrlFromParagraph(node: Element): string | undefined {
  if (!isParagraph(node)) return undefined;
  return extractUrlFromNodes(node.children as Node[]);
}

function figureWrapper(figure: Element): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["figure-wrapper"] },
    children: [figure],
  };
}

function buildMapFigure(
  url: string,
  captionNodes: Node[],
  options: MapDirectiveOptions,
): Element {
  return figureWrapper({
    type: "element",
    tagName: "figure",
    properties: { className: ["directive-map"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["directive-map__viewport"],
          "data-map-geojson-url": url,
          "data-map-show-alpha": options.alpha ? "true" : "false",
          "data-map-show-hexbin": options.hexbin ? "true" : "false",
          "data-map-show-hulls": options.hulls ? "true" : "false",
          "data-map-show-legend": options.legend ? "true" : "false",
          "data-map-show-points": options.points ? "true" : "false",
          "data-map-show-heatmap": options.heatmap ? "true" : "false",
          "data-map-state": "loading",
          "aria-busy": "true",
          role: "region",
          "aria-label": "Embedded map",
        },
        children: [
          {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              className: ["directive-map__expand"],
              title: "Expand map",
              "aria-label": "Expand map",
            },
            children: [{ type: "text", value: "Expand" }],
          },
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["directive-map__status"],
              "aria-live": "polite",
            },
            children: [{ type: "text", value: "Loading map..." }],
          },
        ],
      },
      {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: captionNodes,
      },
    ],
  });
}

export const OttonMap: QuartzTransformerPlugin<OttonMapOptions> = (options) => {
  const cartoBasemapsApiKey = options?.cartoBasemapsApiKey?.trim();
  if (!cartoBasemapsApiKey) {
    throw new Error("[OttonMap] The cartoBasemapsApiKey option is required");
  }

  return {
    name: "OttonMap",
    htmlPlugins() {
      return [
        () => {
          return (tree: Root, file) => {
            const source =
              file.data.relativePath ??
              file.data.filePath ??
              file.path ??
              file.basename ??
              "unknown file";

            const fail = (message: string): never => {
              throw new Error(`[DirectiveMap] ${source}: ${message}`);
            };

            const requireUrlFromNodes = (nodes: Node[]): string => {
              const url = extractUrlFromNodes(nodes);
              if (url) return url;
              fail(
                "{{map}} URL line must contain exactly one URL (plain URL or autolinked URL) and no other content",
              );
              throw new Error("Unreachable");
            };

            const requireUrlFromParagraph = (paragraph: Element): string => {
              const url = extractUrlFromParagraph(paragraph);
              if (url) return url;
              fail(
                "{{map}} URL paragraph must contain exactly one URL (plain URL or autolinked URL) and no other content",
              );
              throw new Error("Unreachable");
            };

            visit(
              tree,
              "element",
              (
                node: Element,
                index: number | undefined,
                parent: Parent | undefined,
              ) => {
                if (!parent || index === undefined) return;
                if (!isParagraph(node)) return;

                const paragraphNodes = node.children as Node[];
                const hasBreaks = paragraphNodes.some(
                  (child) => child.type === "element" && child.tagName === "br",
                );

                if (hasBreaks) {
                  const lines = splitLines(paragraphNodes);
                  const firstNonBlank = lines.findIndex(
                    (line) => !isBlankLine(line),
                  );
                  if (firstNonBlank === -1) return;

                  const directive = parseMapDirective(lines[firstNonBlank]);
                  if (!directive.matched) return;
                  if (directive.error) fail(directive.error);

                  if (!hasRenderableCaption(lines[firstNonBlank])) {
                    fail("{{map}} requires caption text after the directive");
                  }

                  const nonBlankFollowingLines = lines
                    .slice(firstNonBlank + 1)
                    .filter((line) => !isBlankLine(line));

                  if (nonBlankFollowingLines.length !== 1) {
                    fail(
                      `{{map}} expects exactly 1 URL line, found ${nonBlankFollowingLines.length}`,
                    );
                  }

                  const url = requireUrlFromNodes(nonBlankFollowingLines[0]);
                  const replacement = buildMapFigure(
                    url,
                    lines[firstNonBlank],
                    directive.options,
                  );
                  parent.children.splice(index, 1, replacement);
                  return;
                }

                const directive = parseMapDirective(paragraphNodes);
                if (!directive.matched) return;
                if (directive.error) fail(directive.error);

                if (!hasRenderableCaption(paragraphNodes)) {
                  fail("{{map}} requires caption text after the directive");
                }

                const siblings = parent.children;
                const next = siblings[index + 1];
                if (!next || !isParagraph(next)) {
                  fail("{{map}} expects exactly 1 following URL paragraph");
                }

                const url = requireUrlFromParagraph(next as Element);
                const replacement = buildMapFigure(
                  url,
                  paragraphNodes,
                  directive.options,
                );
                siblings.splice(index, 2, replacement);
              },
            );
          };
        },
      ];
    },
    externalResources() {
      return {
        css: [{ content: mapStyles, inline: true }],
        js: [
          {
            loadTime: "afterDOMReady",
            contentType: "inline",
            script: `(() => { const cartoBasemapsApiKey = ${JSON.stringify(cartoBasemapsApiKey)}; ${mapScript} })()`,
          },
        ],
      };
    },
  };
};

export const DirectiveMap = OttonMap;
export default OttonMap;
