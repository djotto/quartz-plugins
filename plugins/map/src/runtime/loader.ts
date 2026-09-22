import type { LeafletApi, SpiderfierConstructor } from "./types.js";

const leafletCssHref =
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
const leafletJsHref =
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
const leafletHeatJsHref =
  "https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js";
const leafletSpiderfierJsHref =
  "https://cdnjs.cloudflare.com/ajax/libs/OverlappingMarkerSpiderfier-Leaflet/0.2.6/oms.min.js";
const leafletCssAttr = "data-directive-map-leaflet-css";
const leafletJsAttr = "data-directive-map-leaflet-js";
const leafletHeatJsAttr = "data-directive-map-leaflet-heat-js";
const leafletSpiderfierJsAttr = "data-directive-map-leaflet-spiderfier-js";

let leafletPromise: Promise<LeafletApi> | null = null;
let leafletHeatPromise: Promise<boolean> | null = null;
let leafletSpiderfierPromise: Promise<SpiderfierConstructor> | null = null;

function loadScript<T>(
  src: string,
  attribute: string,
  readApi: () => T | null,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!document.head) {
      reject(new Error("document.head is unavailable"));
      return;
    }
    const existing = document.querySelector(`script[${attribute}="true"]`);
    const script =
      existing instanceof HTMLScriptElement
        ? existing
        : document.createElement("script");
    const detachListeners = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
    const fail = () => {
      detachListeners();
      // A later map must retry instead of waiting on an already-failed script's load event.
      script.remove();
      reject(new Error("Map dependency failed to load: " + src));
    };
    const onLoad = () => {
      const api = readApi();
      if (api === null) {
        fail();
        return;
      }
      detachListeners();
      resolve(api);
    };
    const onError = () => fail();
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.setAttribute(attribute, "true");
      document.head.appendChild(script);
    }
  });
}

export async function ensureLeaflet() {
  if (
    !document.querySelector(`link[${leafletCssAttr}="true"]`) &&
    document.head
  ) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = leafletCssHref;
    link.setAttribute(leafletCssAttr, "true");
    document.head.appendChild(link);
  }
  const readApi = () => {
    const candidate = window.L;
    return candidate && typeof candidate.map === "function" ? candidate : null;
  };
  const existing = readApi();
  if (existing) return existing;
  leafletPromise ??= loadScript(leafletJsHref, leafletJsAttr, readApi).catch(
    (error: unknown) => {
      leafletPromise = null;
      throw error;
    },
  );
  return leafletPromise;
}

export async function ensureLeafletHeat(L: LeafletApi) {
  const readApi = () => (typeof L.heatLayer === "function" ? true : null);
  if (readApi()) return true;
  leafletHeatPromise ??= loadScript(
    leafletHeatJsHref,
    leafletHeatJsAttr,
    readApi,
  ).catch((error: unknown) => {
    leafletHeatPromise = null;
    throw error;
  });
  return leafletHeatPromise;
}

export async function ensureLeafletSpiderfier() {
  const readApi = () => {
    const candidate = window.OverlappingMarkerSpiderfier;
    return typeof candidate === "function" ? candidate : null;
  };
  const existing = readApi();
  if (existing) return existing;
  leafletSpiderfierPromise ??= loadScript(
    leafletSpiderfierJsHref,
    leafletSpiderfierJsAttr,
    readApi,
  ).catch((error: unknown) => {
    leafletSpiderfierPromise = null;
    throw error;
  });
  return leafletSpiderfierPromise;
}
