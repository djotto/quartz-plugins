import type { Element, Root } from "hast";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";
import { calloutStyles } from "./styles.js";

export interface CalloutMetadata {
  normalized: string;
  source?: string;
  variants: string[];
}

export function normalizeCalloutMetadata(rawMetadata: string): CalloutMetadata {
  const tokens = rawMetadata
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => (token.startsWith("+") ? token.toLowerCase() : token));

  const dedupedTokens: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    dedupedTokens.push(token);
  }

  const sourceToken = dedupedTokens.find((token) =>
    token.startsWith("+source:"),
  );
  const source = sourceToken?.slice("+source:".length) || undefined;
  const variants = dedupedTokens
    .filter((token) => token.startsWith("+") && !token.startsWith("+source:"))
    .map((token) => token.slice(1));

  return {
    normalized: dedupedTokens.join(" "),
    source,
    variants,
  };
}

function propertyString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function propertyTokens(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((token): token is string => typeof token === "string");
  }
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
  return [];
}

function readProperty(
  properties: Element["properties"],
  name: string,
): unknown {
  return (
    properties[name] ??
    properties[name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)]
  );
}

function writeProperty(
  properties: Element["properties"],
  name: string,
  value: string | boolean,
): void {
  const dashedName = name.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`,
  );
  properties[name] = value;
  if (dashedName !== name) delete properties[dashedName];
}

function deleteProperty(properties: Element["properties"], name: string): void {
  delete properties[name];
  delete properties[
    name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  ];
}

function hasClass(node: Element, className: string): boolean {
  const value: unknown = node.properties.className;
  if (Array.isArray(value)) return value.includes(className);
  return typeof value === "string" && value.split(/\s+/).includes(className);
}

function normalizeClasses(node: Element, calloutType: string): void {
  const classes = propertyTokens(
    node.properties.className ?? node.properties.class,
  );
  const normalizedType = calloutType.toLowerCase();

  if (!classes.some((className) => className.toLowerCase() === "callout")) {
    classes.unshift("callout");
  }
  const typeIndex = classes.findIndex(
    (className) => className.toLowerCase() === normalizedType,
  );
  if (typeIndex >= 0) {
    classes[typeIndex] = normalizedType;
  } else if (
    !classes.some((className) => className.toLowerCase() === normalizedType)
  ) {
    classes.push(normalizedType);
  }

  node.properties.className = classes;
  delete node.properties.class;
}

function directChildWithClass(
  node: Element,
  className: string,
): Element | undefined {
  return node.children.find(
    (child): child is Element =>
      child.type === "element" && hasClass(child as Element, className),
  );
}

function hasImplicitTitle(node: Element, file: VFile): boolean {
  const lineNumber = node.position?.start.line;
  if (lineNumber === undefined) return false;

  const sourceLine = String(file.value).split(/\r?\n/)[lineNumber - 1];
  if (sourceLine === undefined) return false;

  const startColumn = node.position?.start.column ?? 1;
  let declaration = sourceLine.slice(Math.max(0, startColumn - 1)).trimStart();
  while (declaration.startsWith(">")) {
    declaration = declaration.slice(1).trimStart();
  }

  const match = /^\[![^\]]+\][+-]?(.*)$/.exec(declaration);
  return match !== null && match[1]!.trim() === "";
}

function setTangentTitle(node: Element): void {
  const title = directChildWithClass(node, "callout-title");
  if (title === undefined) return;

  const titleInner = directChildWithClass(title, "callout-title-inner");
  const paragraph = titleInner?.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "p",
  );
  if (paragraph === undefined) return;

  paragraph.children = [{ type: "text", value: "Tangent" }];
}

export function transformOttonCallouts(tree: Root, file: VFile): void {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "blockquote") return;

    const rawType = propertyString(
      readProperty(node.properties, "dataCallout") ??
        readProperty(node.properties, "type"),
    );
    if (rawType === undefined) return;

    const rawCalloutType = rawType.trim().toLowerCase();
    const calloutType =
      {
        abstract: "abstract",
        summary: "abstract",
        tldr: "abstract",
        cite: "quote",
        hint: "tip",
        important: "tip",
        check: "success",
        done: "success",
        help: "question",
        faq: "question",
        attention: "warning",
        caution: "warning",
        missing: "failure",
        fail: "failure",
        error: "danger",
      }[rawCalloutType] ?? rawCalloutType;
    if (calloutType.length === 0) return;
    writeProperty(node.properties, "dataCallout", calloutType);
    normalizeClasses(node, calloutType);

    const metadataProperty = readProperty(
      node.properties,
      "dataCalloutMetadata",
    );
    const sourceProperty = propertyString(
      readProperty(node.properties, "dataCalloutSource"),
    );
    const variantsProperty = propertyTokens(
      readProperty(node.properties, "dataCalloutVariants"),
    );
    const rawMetadata =
      propertyString(metadataProperty) ??
      [
        sourceProperty ? `+source:${sourceProperty}` : "",
        ...variantsProperty.map((variant) =>
          variant.startsWith("+") ? variant : `+${variant}`,
        ),
      ]
        .filter(Boolean)
        .join(" ");

    const metadata = normalizeCalloutMetadata(rawMetadata);
    writeProperty(node.properties, "dataCalloutMetadata", metadata.normalized);

    deleteProperty(node.properties, "dataCalloutSource");
    if (metadata.source !== undefined) {
      writeProperty(node.properties, "dataCalloutSource", metadata.source);
    }

    deleteProperty(node.properties, "dataCalloutVariants");
    if (metadata.variants.length > 0) {
      writeProperty(
        node.properties,
        "dataCalloutVariants",
        metadata.variants.join(" "),
      );
    }

    if (
      calloutType === "note" &&
      metadata.variants.includes("tangent") &&
      hasImplicitTitle(node, file)
    ) {
      setTangentTitle(node);
    }
  });
}

export const OttonCallouts: QuartzTransformerPlugin = () => ({
  name: "OttonCallouts",
  htmlPlugins() {
    return [() => transformOttonCallouts];
  },
  externalResources() {
    return {
      css: [{ content: calloutStyles, inline: true }],
    };
  },
});

export default OttonCallouts;
