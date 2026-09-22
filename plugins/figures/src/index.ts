import type { Element, ElementContent, Parent, Root, Text } from "hast";
import type {
  BuildCtx,
  QuartzTransformerPlugin,
} from "@quartz-community/types";
import type { VFile } from "vfile";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { visit } from "unist-util-visit";
import { slugifyFilePath } from "@quartz-community/utils";
import { figureStyles } from "./styles.js";

export const beforeAfterClasses = {
  figure: "before-after",
  figureCarousel: "before-after--carousel",
  stage: "before-after__stage",
  image: "before-after__image",
  imageBefore: "before-after__image--before",
  imageAfter: "before-after__image--after",
  afterLayer: "before-after__after",
  range: "before-after__range",
  handle: "before-after__handle",
} as const;

type DirectiveKind = "caption" | "compare";
type ParsedDirective =
  { kind: DirectiveKind } | { kind: "unknown"; raw: string };

const directiveRegex = /^\s*\{\{([a-z-]+)\}\}\s*/i;

function isParagraph(node: unknown): node is Element {
  return (
    (node as Element | undefined)?.type === "element" &&
    (node as Element).tagName === "p"
  );
}

function splitLines(nodes: ElementContent[]): ElementContent[][] {
  const lines: ElementContent[][] = [[]];
  for (const child of nodes) {
    if (child.type === "element" && child.tagName === "br") {
      lines.push([]);
    } else {
      lines[lines.length - 1]!.push(child);
    }
  }
  return lines;
}

function isBlankLine(nodes: ElementContent[]): boolean {
  return nodes.every(
    (child) => child.type === "text" && child.value.trim().length === 0,
  );
}

function firstText(nodes: ElementContent[]): Text | undefined {
  return nodes.find((child): child is Text => child.type === "text");
}

function parseDirective(nodes: ElementContent[]): ParsedDirective | null {
  const text = firstText(nodes);
  if (!text) return null;
  const match = directiveRegex.exec(text.value);
  if (!match) return null;

  text.value = text.value.replace(directiveRegex, "");
  const raw = match[1]!.toLowerCase();
  if (raw === "caption" || raw === "compare") return { kind: raw };
  return { kind: "unknown", raw };
}

function hasRenderableCaption(nodes: ElementContent[]): boolean {
  return nodes.some(
    (child) =>
      child.type === "element" || (child.type === "text" && child.value.trim()),
  );
}

function extractImageFromNodes(nodes: ElementContent[]): Element | undefined {
  let image: Element | undefined;
  for (const child of nodes) {
    if (child.type === "text") {
      if (child.value.trim()) return undefined;
      continue;
    }
    if (child.type !== "element" || !isFigureMedia(child) || image)
      return undefined;
    image = child;
  }
  return image;
}

function extractImageFromParagraph(node: Element): Element | undefined {
  return isParagraph(node) ? extractImageFromNodes(node.children) : undefined;
}

function embeddedImages(
  nodes: ElementContent[],
): { caption: ElementContent[]; images: Element[] } | undefined {
  const firstImage = nodes.findIndex(
    (child) => child.type === "element" && isFigureMedia(child),
  );
  if (firstImage < 0) return undefined;

  const caption = nodes.slice(0, firstImage);
  const images: Element[] = [];
  for (const child of nodes.slice(firstImage)) {
    if (child.type === "text") {
      if (child.value.trim()) return undefined;
      continue;
    }
    if (child.type !== "element" || !isFigureMedia(child)) return undefined;
    images.push(child);
  }
  return { caption, images };
}

function isFigureMedia(node: Element): boolean {
  // OFM renders raster embeds as <img> and SVG embeds as <object>.
  return node.tagName === "img" || node.tagName === "object";
}

function ensureLazyLoading(image: Element): void {
  if (image.tagName !== "img") return;
  image.properties = {
    ...image.properties,
    loading: image.properties.loading ?? "lazy",
  };
}

function ensureClassName(element: Element, className: string): void {
  const existing: unknown = element.properties.className;
  const classes = Array.isArray(existing)
    ? existing.filter((value): value is string => typeof value === "string")
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : [];
  if (!classes.includes(className)) classes.push(className);
  element.properties.className = classes;
}

function labelFromAlt(
  properties: Element["properties"],
  fallback: string,
): string {
  const alt = properties.alt ?? properties.ariaLabel;
  return typeof alt === "string" && alt.trim() ? alt.trim() : fallback;
}

function figureWrapper(figure: Element): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["figure-wrapper"] },
    children: [figure],
  };
}

function isStandaloneMediaParagraph(node: Element): boolean {
  return (
    node.tagName === "p" &&
    node.children.length > 0 &&
    node.children.every(
      (child) =>
        (child.type === "text" && child.value.trim().length === 0) ||
        (child.type === "element" && isFigureMedia(child)),
    ) &&
    node.children.some(
      (child) => child.type === "element" && isFigureMedia(child),
    )
  );
}

function wrapStandardFigures(tree: Root): void {
  const walk = (parent: Parent, insideFigure: boolean): void => {
    for (let index = 0; index < parent.children.length; index += 1) {
      const child = parent.children[index];
      if (child.type !== "element") continue;
      const childInsideFigure = insideFigure || child.tagName === "figure";

      if (!insideFigure && isStandaloneMediaParagraph(child)) {
        const media = child.children.filter(
          (candidate): candidate is Element =>
            candidate.type === "element" && isFigureMedia(candidate),
        );
        const wrappers = media.map((image) =>
          figureWrapper({
            type: "element",
            tagName: "figure",
            properties: {},
            children: [image],
          }),
        );
        parent.children.splice(index, 1, ...wrappers);
        index += wrappers.length - 1;
        continue;
      }

      if (!insideFigure && isFigureMedia(child)) {
        parent.children[index] = figureWrapper({
          type: "element",
          tagName: "figure",
          properties: {},
          children: [child],
        });
        continue;
      }

      walk(child, childInsideFigure);
    }
  };
  walk(tree, false);
}

const dimensionsCache = new Map<
  string,
  { width: number; height: number } | null
>();
const contentFilesCache = new Map<string, Promise<string[]>>();

async function contentFiles(contentRoot: string): Promise<string[]> {
  const cached = contentFilesCache.get(contentRoot);
  if (cached) return cached;
  const pending = (async () => {
    const files: string[] = [];
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await fs.readdir(directory, {
        withFileTypes: true,
      })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(candidate);
        else files.push(candidate);
      }
    };
    await walk(contentRoot);
    return files;
  })();
  contentFilesCache.set(contentRoot, pending);
  return pending;
}

function hasNumericDimension(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return false;
  return Number.isFinite(Number.parseInt(value, 10));
}

async function imageDimensions(
  filePath: string,
): Promise<{ width: number; height: number } | null> {
  if (dimensionsCache.has(filePath))
    return dimensionsCache.get(filePath) ?? null;
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width && metadata.height) {
      const dimensions = { width: metadata.width, height: metadata.height };
      dimensionsCache.set(filePath, dimensions);
      return dimensions;
    }
  } catch {
    // Unsupported and missing assets retain their existing dimensions.
  }
  dimensionsCache.set(filePath, null);
  return null;
}

async function addMediaMetadata(
  tree: Root,
  ctx: BuildCtx,
  file: VFile,
): Promise<void> {
  const contentRoot = ctx.argv?.directory;
  if (typeof contentRoot !== "string" || !contentRoot) return;
  const relativePath = file.data.relativePath ?? file.path ?? "";
  const noteDirectory = path.posix.dirname(
    relativePath.replaceAll(path.sep, "/"),
  );
  const allFiles = await contentFiles(path.resolve(contentRoot));
  const tasks: Promise<void>[] = [];

  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "img" && node.tagName !== "object") return;
    const sourceProperty = node.tagName === "object" ? "data" : "src";
    const source =
      typeof node.properties[sourceProperty] === "string"
        ? String(node.properties[sourceProperty])
        : "";
    if (
      !source ||
      /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(source) ||
      source.startsWith("data:")
    )
      return;
    const assetPath = resolveImageAsset(
      contentRoot,
      noteDirectory,
      source,
      allFiles,
    );
    if (!assetPath) return;
    if (node.tagName === "object") {
      const relativeAssetPath = path
        .relative(path.resolve(contentRoot), assetPath)
        .replaceAll(path.sep, "/");
      node.properties.data = `/${slugifyFilePath(relativeAssetPath as never)}`;
      return;
    }
    if (
      hasNumericDimension(node.properties.width) ||
      hasNumericDimension(node.properties.height)
    )
      return;
    tasks.push(
      imageDimensions(assetPath).then((dimensions) => {
        if (!dimensions) return;
        node.properties = {
          ...node.properties,
          width: dimensions.width,
          height: dimensions.height,
        };
      }),
    );
  });
  await Promise.all(tasks);
}

/** Resolve an OFM image URL to the source asset copied by Quartz's slugifying emitter. */
export function resolveImageAsset(
  contentRoot: string,
  noteDirectory: string,
  source: string,
  allFiles: string[],
): string | undefined {
  const withoutQuery = source.split(/[?#]/, 1)[0] ?? "";
  let decodedSource = withoutQuery;
  try {
    decodedSource = decodeURIComponent(withoutQuery);
  } catch {
    // Keep the original URI when malformed percent-encoding is present.
  }
  const isRoot = decodedSource.startsWith("/");
  const cleaned = path.posix.normalize(
    decodedSource.replace(/^\.?\/+/, "").replace(/^\/+/, ""),
  );
  if (!cleaned || cleaned === ".") return undefined;

  const root = path.resolve(contentRoot);
  const entries = allFiles.map((absolutePath) => {
    const relative = path
      .relative(root, absolutePath)
      .replaceAll(path.sep, "/");
    return {
      absolutePath,
      relative,
      slug: slugifyFilePath(relative as never),
      basenameSlug: slugifyFilePath(path.posix.basename(relative) as never),
    };
  });
  const findSlug = (candidate: string): string | undefined => {
    const slug = slugifyFilePath(path.posix.normalize(candidate) as never);
    return entries.find((entry) => entry.slug === slug)?.absolutePath;
  };

  const normalizedNoteDirectory = path.posix.normalize(
    noteDirectory.replaceAll(path.sep, "/"),
  );
  if (!isRoot) {
    const fromNote = findSlug(
      path.posix.join(normalizedNoteDirectory, cleaned),
    );
    if (fromNote) return fromNote;
  }
  const fromRoot = findSlug(cleaned);
  if (fromRoot) return fromRoot;

  const basenameSlug = slugifyFilePath(path.posix.basename(cleaned) as never);
  const matches = entries.filter(
    (entry) => entry.basenameSlug === basenameSlug,
  );
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0]!.absolutePath;

  const noteRoot = path.resolve(root, normalizedNoteDirectory);
  return matches.slice().sort((left, right) => {
    const leftDepth = path
      .relative(noteRoot, left.absolutePath)
      .split(path.sep).length;
    const rightDepth = path
      .relative(noteRoot, right.absolutePath)
      .split(path.sep).length;
    return leftDepth - rightDepth;
  })[0]!.absolutePath;
}

function buildCaptionFigure(
  image: Element,
  caption: ElementContent[],
): Element {
  ensureLazyLoading(image);
  return figureWrapper({
    type: "element",
    tagName: "figure",
    properties: {},
    children: [
      image,
      {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: caption,
      },
    ],
  });
}

function removeLegacyCaptionMarker(nodes: ElementContent[]): boolean {
  for (const child of nodes) {
    if (child.type === "text") {
      if (!child.value.trim()) continue;
      if (!/^\s*:(?:\s+|$)/.test(child.value)) return false;
      child.value = child.value.replace(/^\s*:(?:\s+|$)/, "");
      return hasRenderableCaption(nodes);
    }
    return false;
  }
  return false;
}

function transformLegacyCaptions(tree: Root): void {
  const walk = (parent: Parent, insideFigure: boolean): void => {
    for (let index = 0; index < parent.children.length; index += 1) {
      const child = parent.children[index];
      if (child.type !== "element") continue;

      if (!insideFigure && isStandaloneMediaParagraph(child)) {
        let captionIndex = index + 1;
        while (
          parent.children[captionIndex]?.type === "text" &&
          !(parent.children[captionIndex] as Text).value.trim()
        ) {
          captionIndex += 1;
        }
        const caption = parent.children[captionIndex];
        const image = extractImageFromParagraph(child);
        if (
          image &&
          caption?.type === "element" &&
          isParagraph(caption) &&
          removeLegacyCaptionMarker(caption.children)
        ) {
          parent.children.splice(
            index,
            captionIndex - index + 1,
            buildCaptionFigure(image, caption.children),
          );
          continue;
        }
      }

      walk(child, insideFigure || child.tagName === "figure");
    }
  };

  walk(tree, false);
}

function buildCompareFigure(
  beforeImage: Element,
  afterImage: Element,
  caption: ElementContent[],
): Element {
  ensureClassName(beforeImage, beforeAfterClasses.image);
  ensureClassName(beforeImage, beforeAfterClasses.imageBefore);
  ensureClassName(afterImage, beforeAfterClasses.image);
  ensureClassName(afterImage, beforeAfterClasses.imageAfter);
  ensureLazyLoading(beforeImage);
  ensureLazyLoading(afterImage);

  const beforeAlt = labelFromAlt(beforeImage.properties, "Before");
  const afterAlt = labelFromAlt(afterImage.properties, "After");
  const rangeLabel = `Reveal comparison between ${beforeAlt} and ${afterAlt}`;
  return figureWrapper({
    type: "element",
    tagName: "figure",
    properties: { className: [beforeAfterClasses.figure] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: [beforeAfterClasses.stage] },
        children: [
          beforeImage,
          {
            type: "element",
            tagName: "div",
            properties: { className: [beforeAfterClasses.afterLayer] },
            children: [afterImage],
          },
          {
            type: "element",
            tagName: "input",
            properties: {
              className: [beforeAfterClasses.range],
              type: "range",
              min: "0",
              max: "100",
              step: "1",
              value: "50",
              "aria-label": rangeLabel,
            },
            children: [],
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: [beforeAfterClasses.handle] },
            children: [],
          },
        ],
      },
      {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: caption,
      },
    ],
  });
}

function directiveKind(
  directive: ParsedDirective,
  source: string,
): DirectiveKind {
  if (directive.kind === "unknown")
    throw new Error(
      `[OttonFigures] ${source}: unknown figure directive "{{${directive.raw}}}"`,
    );
  return directive.kind;
}

function requireImage(
  nodes: ElementContent[],
  kind: DirectiveKind,
  source: string,
): Element {
  const image = extractImageFromNodes(nodes);
  if (image) return image;
  throw new Error(
    `[OttonFigures] ${source}: {{${kind}}} image lines must contain exactly one image and no other content`,
  );
}

function requireParagraphImage(
  node: Element,
  kind: DirectiveKind,
  source: string,
): Element {
  const image = extractImageFromParagraph(node);
  if (image) return image;
  throw new Error(
    `[OttonFigures] ${source}: {{${kind}}} image paragraphs must contain exactly one image and no other content`,
  );
}

export function transformOttonFigures(tree: Root, file: VFile): void {
  const source =
    file.data.relativePath ??
    file.data.filePath ??
    file.path ??
    file.basename ??
    "unknown file";
  const failCount = (
    kind: DirectiveKind,
    expected: number,
    found: number,
  ): never => {
    throw new Error(
      `[OttonFigures] ${source}: {{${kind}}} expects exactly ${expected} image line${expected === 1 ? "" : "s"}, found ${found}`,
    );
  };

  visit(
    tree,
    "element",
    (node: Element, index: number | undefined, parent: Parent | undefined) => {
      if (!parent || index === undefined || !isParagraph(node)) return;
      const paragraphNodes = node.children;

      // With the v5 OFM pipeline a newline before an embedded image can remain
      // inside one paragraph (rather than becoming a separate paragraph). This
      // is the shape produced by the site's existing directive usages, so accept
      // it in addition to v4's paragraph-per-line shape.
      const embeddedDirective = parseDirective(paragraphNodes);
      if (embeddedDirective) {
        const kind = directiveKind(embeddedDirective, source);
        const embedded = embeddedImages(paragraphNodes);
        if (embedded) {
          const expected = kind === "caption" ? 1 : 2;
          if (embedded.images.length !== expected)
            failCount(kind, expected, embedded.images.length);
          if (!hasRenderableCaption(embedded.caption)) {
            throw new Error(
              `[OttonFigures] ${source}: {{${kind}}} requires caption text after the directive`,
            );
          }
          const replacement =
            kind === "caption"
              ? buildCaptionFigure(embedded.images[0]!, embedded.caption)
              : buildCompareFigure(
                  embedded.images[0]!,
                  embedded.images[1]!,
                  embedded.caption,
                );
          parent.children.splice(index, 1, replacement);
          return;
        }
      }

      const hasBreaks = paragraphNodes.some(
        (child) => child.type === "element" && child.tagName === "br",
      );

      if (hasBreaks) {
        const lines = splitLines(paragraphNodes);
        const firstNonBlank = lines.findIndex((line) => !isBlankLine(line));
        if (firstNonBlank < 0) return;
        const parsed =
          embeddedDirective ?? parseDirective(lines[firstNonBlank]!);
        if (!parsed) return;
        const kind = directiveKind(parsed, source);
        const expected = kind === "caption" ? 1 : 2;
        const imageLines = lines
          .slice(firstNonBlank + 1)
          .filter((line) => !isBlankLine(line));
        if (imageLines.length !== expected)
          failCount(kind, expected, imageLines.length);
        if (!hasRenderableCaption(lines[firstNonBlank]!)) {
          throw new Error(
            `[OttonFigures] ${source}: {{${kind}}} requires caption text after the directive`,
          );
        }
        const images = imageLines.map((line) =>
          requireImage(line, kind, source),
        );
        const replacement =
          kind === "caption"
            ? buildCaptionFigure(images[0]!, lines[firstNonBlank]!)
            : buildCompareFigure(images[0]!, images[1]!, lines[firstNonBlank]!);
        parent.children.splice(index, 1, replacement);
        return;
      }

      const parsed = embeddedDirective ?? parseDirective(paragraphNodes);
      if (!parsed) return;
      const kind = directiveKind(parsed, source);
      const expected = kind === "caption" ? 1 : 2;
      const consumed = parent.children.slice(index + 1, index + 1 + expected);
      if (consumed.length !== expected || !consumed.every(isParagraph)) {
        throw new Error(
          `[OttonFigures] ${source}: {{${kind}}} expects exactly ${expected} following image paragraph${expected === 1 ? "" : "s"}`,
        );
      }
      if (!hasRenderableCaption(paragraphNodes)) {
        throw new Error(
          `[OttonFigures] ${source}: {{${kind}}} requires caption text after the directive`,
        );
      }
      const images = (consumed as Element[]).map((paragraph) =>
        requireParagraphImage(paragraph, kind, source),
      );
      const replacement =
        kind === "caption"
          ? buildCaptionFigure(images[0]!, paragraphNodes)
          : buildCompareFigure(images[0]!, images[1]!, paragraphNodes);
      parent.children.splice(index, expected + 1, replacement);
    },
  );
}

const sliderScript = String.raw`
(() => {
  const bindStage = (stage) => {
    if (!(stage instanceof HTMLElement) || stage.dataset.beforeAfterBound === "true") return
    stage.dataset.beforeAfterBound = "true"
    const range = stage.querySelector(".before-after__range")
    const handle = stage.querySelector(".before-after__handle")
    const setPosition = (value) => {
      const percent = Math.min(100, Math.max(0, Number(value) || 0))
      stage.style.setProperty("--before-after-position", percent + "%")
      if (range instanceof HTMLInputElement) range.value = String(Math.round(percent))
    }
    const fromPointer = (event) => {
      const rect = stage.getBoundingClientRect()
      if (rect.width) setPosition(((event.clientX - rect.left) / rect.width) * 100)
    }
    const onInput = (event) => setPosition(event.target?.value)
    const onPointerDown = (event) => {
      if (!(handle instanceof HTMLElement)) return
      event.preventDefault()
      range?.focus({ preventScroll: true })
      handle.setPointerCapture?.(event.pointerId)
      fromPointer(event)
      handle.addEventListener("pointermove", fromPointer)
      handle.addEventListener("pointerup", onPointerUp)
      handle.addEventListener("pointercancel", onPointerUp)
    }
    const onPointerUp = (event) => {
      handle?.releasePointerCapture?.(event.pointerId)
      handle?.removeEventListener("pointermove", fromPointer)
      handle?.removeEventListener("pointerup", onPointerUp)
      handle?.removeEventListener("pointercancel", onPointerUp)
    }
    setPosition(range instanceof HTMLInputElement ? range.value : 50)
    range?.addEventListener("input", onInput)
    range?.addEventListener("change", onInput)
    handle?.addEventListener("pointerdown", onPointerDown)
  }
  let carousel
  let carouselStage
  let items = []
  let currentIndex = 0
  let lastFocusedElement
  let carouselMapCleanup = () => {}

  const getMapRuntime = () => window.__directiveMapRuntime

  const disposeCarouselContent = () => {
    carouselMapCleanup()
    carouselMapCleanup = () => {}
    carouselStage?.replaceChildren()
  }

  const ensureCarousel = () => {
    if (carousel && document.contains(carousel)) return
    carousel = null
    carouselStage = null
    carousel = document.createElement("div")
    carousel.id = "figcaption-carousel"
    carousel.className = "figcaption-carousel"
    carousel.setAttribute("role", "dialog")
    carousel.setAttribute("aria-modal", "true")
    carousel.setAttribute("aria-hidden", "true")
    carousel.tabIndex = -1
    carouselStage = document.createElement("div")
    carouselStage.className = "figcaption-carousel__stage"
    const close = document.createElement("button")
    close.type = "button"
    close.className = "figcaption-carousel__close"
    close.textContent = "Close"
    const previous = document.createElement("button")
    previous.type = "button"
    previous.className = "figcaption-carousel__nav figcaption-carousel__prev"
    previous.textContent = "Prev"
    const next = document.createElement("button")
    next.type = "button"
    next.className = "figcaption-carousel__nav figcaption-carousel__next"
    next.textContent = "Next"
    carousel.append(close, previous, carouselStage, next)
    document.body.appendChild(carousel)
    close.addEventListener("click", closeCarousel)
    previous.addEventListener("click", () => showIndex(currentIndex - 1))
    next.addEventListener("click", () => showIndex(currentIndex + 1))
    carousel.addEventListener("click", (event) => {
      if (event.target === carousel) closeCarousel()
    })
  }

  const getFocusable = () => carousel
    ? Array.from(carousel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'))
    : []

  const showIndex = (index) => {
    if (!items.length || !carouselStage) return
    currentIndex = (index + items.length) % items.length
    disposeCarouselContent()
    const figure = items[currentIndex]
    if (figure.matches("figure.directive-map")) {
      const clone = figure.cloneNode(true)
      const runtime = getMapRuntime()
      if (runtime?.prepareFigureForCarousel) runtime.prepareFigureForCarousel(clone)
      carouselStage.appendChild(clone)
      const cleanup = runtime?.bindFigure?.(clone)
      if (typeof cleanup === "function") carouselMapCleanup = cleanup
    } else if (figure.matches(".before-after")) {
      const clone = figure.cloneNode(true)
      clone.classList.add("before-after--carousel")
      clone.querySelector("figcaption")?.remove()
      carouselStage.appendChild(clone)
      const cloneStage = clone.querySelector(".before-after__stage")
      if (cloneStage instanceof HTMLElement) delete cloneStage.dataset.beforeAfterBound
      bindStage(cloneStage)
    } else {
      const media = figure.querySelector("img, object")
      if (media) {
        const clone = media.cloneNode(true)
        clone.classList.add("figcaption-carousel__image")
        clone.removeAttribute("loading")
        carouselStage.appendChild(clone)
      }
    }
  }

  const openCarousel = (figure) => {
    ensureCarousel()
    items = Array.from(document.querySelectorAll("figure")).filter(
      (candidate) =>
        candidate.matches(".directive-map") || candidate.querySelector("img, object"),
    )
    currentIndex = Math.max(0, items.indexOf(figure))
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    showIndex(currentIndex)
    carousel.classList.add("is-open")
    carousel.setAttribute("aria-hidden", "false")
    document.body.classList.add("figcaption-carousel-open")
    carousel.focus({ preventScroll: true })
  }

  const closeCarousel = () => {
    if (!carousel) return
    disposeCarouselContent()
    carousel.classList.remove("is-open")
    carousel.setAttribute("aria-hidden", "true")
    document.body.classList.remove("figcaption-carousel-open")
    if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus({ preventScroll: true })
  }

  const bindFigures = () => document.querySelectorAll("figure").forEach((figure) => {
    if (!figure.querySelector("img, object") || figure.dataset.figcaptionBound === "true") return
    figure.dataset.figcaptionBound = "true"
    figure.querySelectorAll("img, object").forEach((media) => {
      media.addEventListener("click", (event) => {
        if (event.target?.closest?.(".before-after__handle, .before-after__range")) return
        openCarousel(figure)
      })
    })
  })

  const registerCleanup = () => {
    if (typeof window.addCleanup !== "function") return
    window.addCleanup(() => {
      closeCarousel()
      if (carousel && !document.contains(carousel)) {
        carousel = null
        carouselStage = null
      }
    })
  }

  document.addEventListener("keydown", (event) => {
    if (!carousel?.classList.contains("is-open")) return
    if (event.key === "Escape") closeCarousel()
    else if (event.key === "ArrowLeft") showIndex(currentIndex - 1)
    else if (event.key === "ArrowRight") showIndex(currentIndex + 1)
    else if (event.key === "Tab") {
      const focusable = getFocusable()
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  })

  const init = () => {
    registerCleanup()
    document.querySelectorAll(".before-after__stage").forEach(bindStage)
    bindFigures()
  }
  document.addEventListener("nav", init)
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true })
  else init()

  window.__figcaptionCarouselRuntime = { openFigure: openCarousel }
})()
`;

export const OttonFigures: QuartzTransformerPlugin = () => ({
  name: "OttonFigures",
  htmlPlugins(ctx) {
    return [
      () => async (tree, file) => {
        transformOttonFigures(tree, file);
        transformLegacyCaptions(tree);
        wrapStandardFigures(tree);
        await addMediaMetadata(tree, ctx, file);
      },
    ];
  },
  externalResources() {
    return {
      css: [{ content: figureStyles, inline: true }],
      js: [
        {
          loadTime: "afterDOMReady",
          contentType: "inline",
          script: sliderScript,
        },
      ],
    };
  },
});

export const DirectiveFigure = OttonFigures;
export default OttonFigures;
