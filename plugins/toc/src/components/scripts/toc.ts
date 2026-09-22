type CleanupWindow = Window & {
  addCleanup?: (cleanup: () => void) => void;
};

export const ACTIVE_OFFSET_PX = 80;

export function updateActiveHeading(
  headings: readonly HTMLElement[],
  links: readonly HTMLAnchorElement[],
  offset = ACTIVE_OFFSET_PX,
): string | null {
  if (headings.length === 0 || links.length === 0) return null;
  const linkedSlugs = new Set(
    links.map((link) => link.dataset.for ?? link.getAttribute("data-for")),
  );
  let active: HTMLElement | undefined;
  for (const heading of headings) {
    if (!heading.id || !linkedSlugs.has(heading.id)) continue;
    if (heading.getBoundingClientRect().top - offset <= 0) active = heading;
    else break;
  }
  return (
    active?.id ??
    headings.find((heading) => linkedSlugs.has(heading.id))?.id ??
    null
  );
}

export function setActiveSlug(
  links: readonly HTMLAnchorElement[],
  slug: string | null,
) {
  for (const link of links) {
    link.classList.toggle(
      "in-view",
      Boolean(
        slug && (link.dataset.for ?? link.getAttribute("data-for")) === slug,
      ),
    );
  }
}

export function toggleTocState(button: HTMLElement, content: HTMLElement) {
  const collapsed = !button.classList.contains("collapsed");
  button.classList.toggle("collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  content.classList.toggle("collapsed", collapsed);
  content.setAttribute("aria-hidden", String(collapsed));
  content.hidden = collapsed;
}

export function installTocBehavior(
  doc: Document = document,
  win: CleanupWindow = window,
): () => void {
  let headings: HTMLElement[] = [];
  let links: HTMLAnchorElement[] = [];
  let activeSlug: string | null = null;
  let frame: number | undefined;
  let disposed = false;
  const clickHandlers = new Map<HTMLElement, (event: Event) => void>();

  const removePageListeners = () => {
    win.removeEventListener("scroll", scheduleUpdate);
    win.removeEventListener("resize", scheduleUpdate);
    if (frame !== undefined) {
      if (typeof win.cancelAnimationFrame === "function")
        win.cancelAnimationFrame(frame);
      frame = undefined;
    }
  };

  const update = () => {
    frame = undefined;
    if (disposed) return;
    const slug = updateActiveHeading(headings, links);
    if (slug === activeSlug) return;
    activeSlug = slug;
    setActiveSlug(links, slug);
  };

  function scheduleUpdate() {
    if (frame !== undefined) return;
    if (typeof win.requestAnimationFrame === "function")
      frame = win.requestAnimationFrame(update);
    else update();
  }

  const activate = () => {
    removePageListeners();
    for (const [button, handler] of clickHandlers)
      button.removeEventListener("click", handler);
    clickHandlers.clear();

    const tocElements = Array.from(doc.querySelectorAll<HTMLElement>(".toc"));
    for (const toc of tocElements) {
      const button = toc.querySelector<HTMLElement>(".toc-header");
      const content = toc.querySelector<HTMLElement>(".toc-content");
      if (!button || !content) continue;
      const handler = () => toggleTocState(button, content);
      button.addEventListener("click", handler);
      clickHandlers.set(button, handler);
    }

    headings = Array.from(
      doc.querySelectorAll<HTMLElement>(
        "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]",
      ),
    );
    links = Array.from(
      doc.querySelectorAll<HTMLAnchorElement>(".toc a[data-for]"),
    );
    activeSlug = null;
    update();
    win.addEventListener("scroll", scheduleUpdate, { passive: true });
    win.addEventListener("resize", scheduleUpdate, { passive: true });
  };

  const navHandler = () => activate();
  doc.addEventListener("nav", navHandler);
  doc.addEventListener("render", navHandler);
  if (doc.readyState === "loading")
    doc.addEventListener("DOMContentLoaded", navHandler, { once: true });
  else activate();

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    removePageListeners();
    doc.removeEventListener("nav", navHandler);
    doc.removeEventListener("render", navHandler);
    doc.removeEventListener("DOMContentLoaded", navHandler);
    for (const [button, handler] of clickHandlers)
      button.removeEventListener("click", handler);
    clickHandlers.clear();
  };
  win.addCleanup?.(cleanup);
  return cleanup;
}
