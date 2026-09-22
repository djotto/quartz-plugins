import type { Layer, Map as LeafletMap, PathOptions, Control } from "leaflet";
import type {
  LeafletApi,
  LegendMember,
  LegendEntry,
  LayerToggle,
} from "./types.js";

// Leaflet and its optional plugins expose different visual operations.
type VisualLayer = Layer & {
  eachLayer?: (callback: (layer: VisualLayer) => void) => void;
  bringToFront?: () => void;
  bringToBack?: () => void;
  setStyle?: (style: PathOptions) => void;
  getRadius?: () => number;
  setRadius?: (radius: number) => void;
  setOptions?: (options: { minOpacity: number }) => void;
  redraw?: () => void;
  setOpacity?: (opacity: number) => void;
  getElement?: () => HTMLElement | SVGElement | undefined;
  options: PathOptions & { minOpacity?: number };
};
type StyleState =
  | {
      kind: "path";
      opacity: number;
      fillOpacity: number | null;
      weight: number | null;
      radius: number | null;
    }
  | { kind: "heat"; minOpacity: number }
  | { kind: "marker"; opacity: number }
  | { kind: "none" };
type VisualMode = "dimmed" | "highlighted" | "normal";
type ControlOptions = { collapsedByDefault?: boolean };

import { normalizeSearchTerm } from "./data.js";

export const bringLayerTreeToFront = (layer: VisualLayer) => {
  if (!layer) return;
  if (typeof layer.eachLayer === "function") {
    layer.eachLayer((childLayer) => {
      bringLayerTreeToFront(childLayer);
    });
    return;
  }
  if (typeof layer.bringToFront === "function") {
    try {
      layer.bringToFront();
    } catch {
      // Some layer types can throw while detached; ignore safely.
    }
  }
};

export const bringLayerTreeToBack = (layer: VisualLayer) => {
  if (!layer) return;
  if (typeof layer.eachLayer === "function") {
    layer.eachLayer((childLayer) => {
      bringLayerTreeToBack(childLayer);
    });
    return;
  }
  if (typeof layer.bringToBack === "function") {
    try {
      layer.bringToBack();
    } catch {
      // Some layer types can throw while detached; ignore safely.
    }
  }
};

export const getMemberZPriority = (member: LegendMember) => {
  const type = member?.type;
  if (type === "heat") return 0;
  if (type === "hexbin") return 1;
  if (type === "hulls") return 2;
  if (type === "alpha") return 3;
  if (type === "points") return 4;
  return 4;
};

export const getOrderedMembersForZ = (memberLayers: LegendMember[]) => {
  if (!Array.isArray(memberLayers)) return [];
  return memberLayers
    .filter((member) => !!member && !!member.layer && !!member.root)
    .slice()
    .sort((a, b) => getMemberZPriority(a) - getMemberZPriority(b));
};

export const isLegendMemberVisible = (
  map: LeafletMap | null,
  member: LegendMember,
) => {
  if (!map || !member || !member.layer || !member.root) return false;
  if (
    typeof member.root.hasLayer === "function" &&
    !member.root.hasLayer(member.layer)
  ) {
    return false;
  }
  if (typeof map.hasLayer === "function" && !map.hasLayer(member.root)) {
    return false;
  }
  return true;
};

export const applyBaseLegendZOrder = (
  map: LeafletMap | null,
  legendEntries: LegendEntry[],
) => {
  if (!map || !Array.isArray(legendEntries)) return;
  legendEntries.forEach((entry) => {
    const orderedMembers = getOrderedMembersForZ(entry?.memberLayers);
    orderedMembers.forEach((member: LegendMember) => {
      if (!isLegendMemberVisible(map, member)) return;
      if (member.type === "heat") {
        bringLayerTreeToBack(member.layer);
        return;
      }
      bringLayerTreeToFront(member.layer);
    });
  });
};

export const createLegendControl = (
  L: LeafletApi,
  map: LeafletMap,
  legendEntries: LegendEntry[],
  options: ControlOptions | null = null,
) => {
  const entries = Array.isArray(legendEntries)
    ? legendEntries.filter((entry) => {
        return (
          entry &&
          typeof entry.label === "string" &&
          entry.label.trim().length > 0 &&
          Array.isArray(entry.memberLayers) &&
          entry.memberLayers.length > 0
        );
      })
    : [];

  if (entries.length < 2) return () => {};

  const collapsedByDefault = !!(options && options.collapsedByDefault);
  const control = new L.Control({ position: "bottomleft" });
  const entryState = new Map(entries.map((entry) => [entry.key, true]));
  const itemRefs = new Map<string, { button: HTMLButtonElement }>();
  const styleState = new WeakMap<VisualLayer, StyleState>();
  let highlightedKey: string | null = null;

  const applyItemState = (entry: LegendEntry, active: boolean) => {
    const refs = itemRefs.get(entry.key);
    if (!refs) return;
    refs.button.classList.toggle("is-off", !active);
    refs.button.setAttribute("aria-pressed", active ? "true" : "false");
    refs.button.title = (active ? "Hide " : "Show ") + entry.label;
  };

  const getNumberOrNull = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const getLayerStyleState = (layer: VisualLayer) => {
    if (!layer || (typeof layer !== "object" && typeof layer !== "function")) {
      return null;
    }
    if (styleState.has(layer)) return styleState.get(layer);

    const options = layer.options || {};
    let nextState: StyleState;
    if (typeof layer.setStyle === "function") {
      nextState = {
        kind: "path",
        opacity: getNumberOrNull(options.opacity) ?? 1,
        fillOpacity: getNumberOrNull(options.fillOpacity) ?? null,
        weight: getNumberOrNull(options.weight) ?? null,
        radius:
          typeof layer.getRadius === "function"
            ? getNumberOrNull(layer.getRadius())
            : null,
      };
    } else if (
      typeof layer.setOptions === "function" &&
      Object.prototype.hasOwnProperty.call(options, "minOpacity")
    ) {
      nextState = {
        kind: "heat",
        minOpacity: getNumberOrNull(options.minOpacity) ?? 0.2,
      };
    } else if (
      typeof layer.setOpacity === "function" &&
      typeof layer.getElement === "function"
    ) {
      nextState = {
        kind: "marker",
        opacity: getNumberOrNull(options.opacity) ?? 1,
      };
    } else {
      nextState = { kind: "none" };
    }
    styleState.set(layer, nextState);
    return nextState;
  };

  const applyLeafLayerVisualState = (layer: VisualLayer, mode: VisualMode) => {
    const layerStyleState = getLayerStyleState(layer);
    if (!layerStyleState || layerStyleState.kind === "none") return;
    const isDimmed = mode === "dimmed";
    const isHighlighted = mode === "highlighted";

    if (
      layerStyleState.kind === "path" &&
      typeof layer.setStyle === "function"
    ) {
      const style: PathOptions = {};
      if (layerStyleState.opacity != null) {
        style.opacity = isDimmed
          ? Math.max(0.06, layerStyleState.opacity * 0.2)
          : isHighlighted
            ? Math.min(1, Math.max(layerStyleState.opacity, 0.98))
            : layerStyleState.opacity;
      }
      if (layerStyleState.fillOpacity != null) {
        style.fillOpacity = isDimmed
          ? Math.max(0.03, layerStyleState.fillOpacity * 0.18)
          : isHighlighted
            ? Math.min(1, Math.max(layerStyleState.fillOpacity, 0.52))
            : layerStyleState.fillOpacity;
      }
      if (layerStyleState.weight != null) {
        style.weight = isDimmed
          ? Math.max(1, layerStyleState.weight * 0.88)
          : isHighlighted
            ? layerStyleState.weight + 0.9
            : layerStyleState.weight;
      }
      if (Object.keys(style).length > 0) {
        layer.setStyle(style);
      }
      if (
        layerStyleState.radius != null &&
        typeof layer.setRadius === "function"
      ) {
        const nextRadius = isDimmed
          ? Math.max(2, layerStyleState.radius * 0.88)
          : isHighlighted
            ? layerStyleState.radius + 1.2
            : layerStyleState.radius;
        layer.setRadius(nextRadius);
      }
      return;
    }

    if (
      layerStyleState.kind === "heat" &&
      typeof layer.setOptions === "function"
    ) {
      if (!map.hasLayer(layer)) {
        return;
      }
      const nextMinOpacity = isDimmed
        ? Math.max(0.03, layerStyleState.minOpacity * 0.35)
        : isHighlighted
          ? Math.min(0.95, Math.max(layerStyleState.minOpacity + 0.08, 0.28))
          : layerStyleState.minOpacity;
      try {
        layer.setOptions({ minOpacity: nextMinOpacity });
        if (typeof layer.redraw === "function") {
          layer.redraw();
        }
      } catch {
        // Leaflet.heat throws when asked to redraw detached layers.
      }
    }

    if (
      layerStyleState.kind === "marker" &&
      typeof layer.setOpacity === "function"
    ) {
      const nextOpacity = isDimmed
        ? Math.max(0.18, layerStyleState.opacity * 0.42)
        : isHighlighted
          ? 1
          : layerStyleState.opacity;
      layer.setOpacity(nextOpacity);
      const markerElement =
        typeof layer.getElement === "function" ? layer.getElement() : null;
      if (markerElement instanceof HTMLElement) {
        markerElement.classList.toggle("is-dimmed", !!isDimmed);
        markerElement.classList.toggle("is-highlighted", !!isHighlighted);
      }
    }
  };

  const applyLayerVisualState = (layer: VisualLayer, mode: VisualMode) => {
    if (!layer) return;
    if (typeof layer.eachLayer === "function") {
      layer.eachLayer((childLayer) => {
        applyLayerVisualState(childLayer, mode);
      });
      return;
    }
    applyLeafLayerVisualState(layer, mode);
  };

  const isMemberActive = (member: LegendMember) =>
    isLegendMemberVisible(map, member);

  const applyEntryVisualState = (entry: LegendEntry, mode: VisualMode) => {
    entry.memberLayers.forEach((member: LegendMember) => {
      if (!isMemberActive(member)) return;
      applyLayerVisualState(member.layer, mode);
    });
  };

  const raiseEntryToTop = (entry: LegendEntry) => {
    if (!entry) return;
    const orderedMembers = getOrderedMembersForZ(entry.memberLayers);
    orderedMembers.forEach((member: LegendMember) => {
      if (!isMemberActive(member)) return;
      const { layer, root } = member;
      if (typeof layer.bringToFront === "function") {
        try {
          layer.bringToFront();
          return;
        } catch {
          // fall back to remove/add for non-path layers.
        }
      }
      if (
        typeof root.removeLayer === "function" &&
        typeof root.addLayer === "function"
      ) {
        root.removeLayer(layer);
        root.addLayer(layer);
      }
    });
  };

  const syncHighlightState = () => {
    const hasHighlight =
      typeof highlightedKey === "string" && highlightedKey.length > 0;
    entries.forEach((entry) => {
      const refs = itemRefs.get(entry.key);
      const active = entryState.get(entry.key) !== false;
      const isHighlighted = hasHighlight && highlightedKey === entry.key;
      const isDimmed = hasHighlight && !isHighlighted && active;

      if (refs) {
        refs.button.classList.toggle("is-highlighted", !!isHighlighted);
        refs.button.classList.toggle("is-dimmed", !!isDimmed);
      }

      if (!active) return;
      const visualMode = isDimmed
        ? "dimmed"
        : isHighlighted
          ? "highlighted"
          : "normal";
      applyEntryVisualState(entry, visualMode);
    });

    if (!hasHighlight) {
      applyBaseLegendZOrder(map, entries);
      return;
    }
    const highlightedEntry = entries.find(
      (entry) => entry.key === highlightedKey,
    );
    if (!highlightedEntry || entryState.get(highlightedEntry.key) === false)
      return;
    raiseEntryToTop(highlightedEntry);
  };

  const setHighlightedKey = (key: string | null) => {
    const nextKey = typeof key === "string" && key.length > 0 ? key : null;
    if (highlightedKey === nextKey) return;
    highlightedKey = nextKey;
    syncHighlightState();
  };

  const toggleEntry = (entry: LegendEntry) => {
    const currentlyActive = entryState.get(entry.key) !== false;
    const nextActive = !currentlyActive;
    entry.memberLayers.forEach((member: LegendMember) => {
      if (!member || !member.layer || !member.root) return;
      const { layer, root } = member;
      if (nextActive) {
        if (typeof root.hasLayer !== "function" || !root.hasLayer(layer)) {
          root.addLayer(layer);
        }
      } else if (typeof root.hasLayer !== "function" || root.hasLayer(layer)) {
        root.removeLayer(layer);
      }
    });
    entryState.set(entry.key, nextActive);
    applyItemState(entry, nextActive);
    syncHighlightState();
  };

  control.onAdd = () => {
    const container = document.createElement("div");
    container.className = "directive-map__legend";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", "Map legend");
    container.addEventListener("mouseleave", () => {
      setHighlightedKey(null);
    });
    container.addEventListener("focusout", (event) => {
      const nextFocused = event.relatedTarget;
      if (!(nextFocused instanceof Node) || !container.contains(nextFocused)) {
        setHighlightedKey(null);
      }
    });

    const disclosure = document.createElement("button");
    disclosure.type = "button";
    disclosure.className = "directive-map__legend-disclosure";

    const disclosureLabel = document.createElement("span");
    disclosureLabel.className = "directive-map__legend-disclosure-label";
    disclosureLabel.textContent = "Key";

    const disclosureMeta = document.createElement("span");
    disclosureMeta.className = "directive-map__legend-disclosure-meta";

    const list = document.createElement("ul");
    list.className = "directive-map__legend-list";
    const listId =
      "directive-map-legend-" + Math.random().toString(36).slice(2, 10);
    list.id = listId;

    let collapsed = collapsedByDefault;
    const applyCollapsedState = () => {
      container.classList.toggle("is-collapsed", collapsed);
      list.hidden = collapsed;
      disclosure.setAttribute("aria-expanded", collapsed ? "false" : "true");
      disclosure.setAttribute("aria-controls", listId);
      disclosureMeta.textContent = collapsed
        ? String(entries.length) + " districts"
        : "Hide";
    };

    entries.forEach((entry) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "directive-map__legend-toggle";

      const swatch = document.createElement("span");
      swatch.className = "directive-map__legend-swatch";
      swatch.style.setProperty("--directive-map-legend-color", entry.color);
      swatch.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "directive-map__legend-label";
      label.textContent = entry.label;

      button.appendChild(swatch);
      button.appendChild(label);

      if (entry.count > 0) {
        const count = document.createElement("span");
        count.className = "directive-map__legend-count";
        count.textContent = String(entry.count);
        count.setAttribute("aria-hidden", "true");
        button.appendChild(count);
      }

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleEntry(entry);
      });
      button.addEventListener("mouseenter", () => {
        setHighlightedKey(entry.key);
      });
      button.addEventListener("focus", () => {
        setHighlightedKey(entry.key);
      });

      itemRefs.set(entry.key, { button });
      applyItemState(entry, entryState.get(entry.key) !== false);

      item.appendChild(button);
      list.appendChild(item);
    });

    disclosure.appendChild(disclosureLabel);
    disclosure.appendChild(disclosureMeta);
    disclosure.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      collapsed = !collapsed;
      applyCollapsedState();
    });

    applyCollapsedState();
    syncHighlightState();

    container.appendChild(disclosure);
    container.appendChild(list);

    if (L?.DomEvent) {
      if (typeof L.DomEvent.disableClickPropagation === "function") {
        L.DomEvent.disableClickPropagation(container);
      }
      if (typeof L.DomEvent.disableScrollPropagation === "function") {
        L.DomEvent.disableScrollPropagation(container);
      }
    }

    return container;
  };

  control.addTo(map);

  return () => {
    setHighlightedKey(null);
    try {
      control.remove();
    } catch {
      // Leaflet control may already be detached during map teardown.
    }
  };
};

export const createLayerModeControl = (
  L: LeafletApi,
  map: LeafletMap,
  layerEntries: LayerToggle[],
  options: ControlOptions | null = null,
) => {
  const entries = Array.isArray(layerEntries)
    ? layerEntries.filter((entry) => {
        return (
          entry &&
          typeof entry.label === "string" &&
          entry.label.trim().length > 0 &&
          entry.layer &&
          typeof entry.layer.addTo === "function"
        );
      })
    : [];

  if (entries.length < 2) return () => {};

  const overlays: Control.LayersObject = {};
  entries.forEach((entry) => {
    overlays[entry.label] = entry.layer;
  });

  const control = L.control.layers(undefined, overlays, {
    position: "topleft",
    collapsed: !!(options && options.collapsedByDefault),
  });
  control.addTo(map);

  return () => {
    try {
      control.remove();
    } catch {
      // Leaflet control may already be detached during map teardown.
    }
  };
};

export const createSearchControl = (
  L: LeafletApi,
  map: LeafletMap,
  onSearch: (term: string) => { message?: string },
) => {
  if (!L || !map || typeof onSearch !== "function") return () => {};

  const control = new L.Control({ position: "topleft" });
  let input: HTMLInputElement | null = null;
  let meta: HTMLDivElement | null = null;
  let lastAppliedTerm = "";

  const applySearch = () => {
    const rawTerm = input instanceof HTMLInputElement ? input.value : "";
    const normalizedTerm = normalizeSearchTerm(rawTerm);
    if (normalizedTerm === lastAppliedTerm) return;
    const result = onSearch(rawTerm) || {};
    lastAppliedTerm = normalizedTerm;
    if (meta instanceof HTMLElement) {
      meta.textContent =
        typeof result.message === "string" && result.message.length > 0
          ? result.message
          : "";
      meta.hidden = meta.textContent.length === 0;
    }
  };

  control.onAdd = () => {
    const container = document.createElement("div");
    container.className = "directive-map__search";
    container.setAttribute("role", "search");
    container.setAttribute("aria-label", "Search map points");

    input = document.createElement("input");
    input.type = "search";
    input.className = "directive-map__search-input";
    input.placeholder = "Search points";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Search map points");

    meta = document.createElement("div");
    meta.className = "directive-map__search-meta";
    meta.hidden = true;

    container.appendChild(input);
    container.appendChild(meta);

    input.addEventListener("input", (event) => {
      event.stopPropagation();
      applySearch();
    });

    if (L?.DomEvent) {
      if (typeof L.DomEvent.disableClickPropagation === "function") {
        L.DomEvent.disableClickPropagation(container);
      }
      if (typeof L.DomEvent.disableScrollPropagation === "function") {
        L.DomEvent.disableScrollPropagation(container);
      }
    }

    return container;
  };

  control.addTo(map);

  return () => {
    try {
      control.remove();
    } catch {
      // Leaflet control may already be detached during map teardown.
    }
  };
};
