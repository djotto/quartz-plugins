import type { TileLayer, FeatureGroup, LatLngBounds } from "leaflet";
import type {
  LeafletApi,
  MapInstance,
  MapViewport,
  Spiderfier,
  SpiderfierConstructor,
  Cleanup,
} from "./types.js";
import {
  statusSelector,
  boundAttr,
  viewportSelector,
  expandButtonSelector,
  logPrefix,
} from "./constants.js";
import {
  parseDataBoolean,
  normalizeSearchTerm,
  filterGeoJsonData,
} from "./data.js";
import { createGeoJsonLayer } from "./layers.js";
import {
  applyBaseLegendZOrder,
  createLayerModeControl,
  createLegendControl,
  createSearchControl,
} from "./controls.js";
import {
  ensureLeaflet,
  ensureLeafletHeat,
  ensureLeafletSpiderfier,
} from "./loader.js";
import { getMarkerPopupHtml, applySpiderLegColors } from "./markers.js";

export function installMapRuntime(cartoBasemapsApiKey: string) {
  let deferredInitFrame = 0;

  const baseTileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const setState = (
    viewport: HTMLElement,
    state: "loading" | "ready" | "empty" | "error",
    message?: string,
  ) => {
    if (!(viewport instanceof HTMLElement)) return;
    viewport.dataset.mapState = state;
    if (state === "loading") {
      viewport.setAttribute("aria-busy", "true");
    } else {
      viewport.removeAttribute("aria-busy");
    }

    const status = viewport.querySelector(statusSelector);
    if (!(status instanceof HTMLElement)) return;
    if (typeof message === "string") {
      status.textContent = message;
    }
    status.hidden = state === "ready";
    status.style.display = state === "ready" ? "none" : "";
  };

  const getSiteTheme = () => {
    const savedTheme = document.documentElement?.getAttribute("saved-theme");
    return savedTheme === "dark" ? "dark" : "light";
  };

  const getBaseTileConfig = (theme: "dark" | "light") => {
    if (theme === "dark") {
      return {
        url:
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=" +
          encodeURIComponent(cartoBasemapsApiKey),
        options: {
          attribution: baseTileAttribution,
          subdomains: "abcd",
          maxZoom: 20,
        },
      };
    }

    return {
      url:
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=" +
        encodeURIComponent(cartoBasemapsApiKey),
      options: {
        attribution: baseTileAttribution,
        subdomains: "abcd",
        maxZoom: 20,
      },
    };
  };

  const createBaseTileLayer = (L: LeafletApi, theme: "dark" | "light") => {
    const config = getBaseTileConfig(theme);
    return L.tileLayer(config.url, config.options);
  };

  const hasCleanupApi = () => typeof window.addCleanup === "function";

  const scheduleInitWhenCleanupReady = () => {
    if (hasCleanupApi()) {
      init();
      return;
    }
    if (deferredInitFrame) return;

    const retry = () => {
      deferredInitFrame = 0;
      if (!hasCleanupApi()) {
        deferredInitFrame = requestAnimationFrame(retry);
        return;
      }

      init();
    };

    deferredInitFrame = requestAnimationFrame(retry);
  };

  const getFigcaptionCarouselRuntime = () => {
    const runtime = window.__figcaptionCarouselRuntime;
    if (!runtime || typeof runtime.openFigure !== "function") return null;
    return runtime;
  };

  const isMapFigure = (value: unknown): value is HTMLElement => {
    return (
      value instanceof HTMLElement && value.matches("figure.directive-map")
    );
  };

  const createStatusElement = () => {
    const status = document.createElement("div");
    status.className = "directive-map__status";
    status.setAttribute("aria-live", "polite");
    status.textContent = "Loading map...";
    return status;
  };

  const resetViewportForCarousel = (viewport: unknown) => {
    if (!(viewport instanceof HTMLElement)) return;

    Array.from(viewport.classList).forEach((className) => {
      if (className.startsWith("leaflet-")) {
        viewport.classList.remove(className);
      }
    });

    viewport.replaceChildren();
    delete viewport.dataset[boundAttr];
    viewport.dataset.mapState = "loading";
    viewport.setAttribute("aria-busy", "true");
    viewport.appendChild(createStatusElement());
  };

  const prepareFigureForCarousel = (figure: unknown) => {
    if (!isMapFigure(figure)) return false;
    figure.classList.add("directive-map--carousel");
    const caption = figure.querySelector("figcaption");
    if (caption) caption.remove();
    Array.from(figure.querySelectorAll<MapViewport>(viewportSelector)).forEach(
      (viewport) => {
        resetViewportForCarousel(viewport);
      },
    );
    return true;
  };

  const bindFigure = (figure: unknown): Cleanup => {
    if (!(figure instanceof HTMLElement)) return () => {};
    const cleanups: Cleanup[] = [];
    const viewports = Array.from(
      figure.querySelectorAll<MapViewport>(viewportSelector),
    );
    viewports.forEach((viewport) => {
      cleanups.push(bindViewport(viewport));
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  };

  const consumeEscape = (figure: unknown) => {
    if (!(figure instanceof HTMLElement)) return false;
    const viewports = Array.from(
      figure.querySelectorAll<MapViewport>(viewportSelector),
    );
    return viewports.some((viewport) => {
      const handler = viewport?.__directiveMapConsumeEscape;
      return typeof handler === "function" && handler() === true;
    });
  };

  const isExpandedViewport = (viewport: unknown) => {
    if (!(viewport instanceof HTMLElement)) return false;
    return (
      viewport.closest(".figcaption-carousel__stage") instanceof HTMLElement
    );
  };

  const bindViewport = (viewport: MapViewport): Cleanup => {
    if (!(viewport instanceof HTMLElement)) return () => {};
    if (viewport.dataset?.[boundAttr] === "true") return () => {};
    if (viewport.dataset) {
      viewport.dataset[boundAttr] = "true";
    }

    const url = viewport.dataset.mapGeojsonUrl;
    if (!url) {
      setState(viewport, "error", "Map URL missing.");
      return () => {
        if (viewport.dataset?.[boundAttr] === "true")
          delete viewport.dataset[boundAttr];
      };
    }
    const showHulls = parseDataBoolean(viewport.dataset.mapShowHulls, true);
    const showHexbin = parseDataBoolean(viewport.dataset.mapShowHexbin, false);
    const showLegend = parseDataBoolean(viewport.dataset.mapShowLegend, true);
    const showPoints = parseDataBoolean(viewport.dataset.mapShowPoints, true);
    const showAlpha = parseDataBoolean(viewport.dataset.mapShowAlpha, false);
    const showHeat = parseDataBoolean(viewport.dataset.mapShowHeatmap, false);

    let L: LeafletApi | null = null;
    let map: MapInstance | null = null;
    let baseTileLayer: TileLayer | null = null;
    let baseTileTheme = "";
    let disposed = false;
    let removeLegendControl = () => {};
    let removeLayerModeControl = () => {};
    let removeSearchControl = () => {};
    let spiderfier: Spiderfier | null = null;
    const abortController =
      typeof AbortController === "function" ? new AbortController() : null;
    const expandButton = viewport.querySelector(expandButtonSelector);
    const expandedViewport = isExpandedViewport(viewport);
    const spiderNearbyDistance = expandedViewport ? 30 : 20;
    let onThemeChange: (() => void) | null = null;
    let onOverlayLayerChange: (() => void) | null = null;
    let heatPaneName = "";
    let activeGeoJsonLayer: FeatureGroup | null = null;
    let activeSearchTerm = "";
    let fullGeoJsonData: unknown = null;

    setState(viewport, "loading", "Loading map...");
    viewport.__directiveMapConsumeEscape = () => {
      const popup = map?._popup;
      if (!popup || typeof map?.closePopup !== "function") {
        return false;
      }
      const popupIsOpen =
        typeof popup.isOpen === "function"
          ? popup.isOpen()
          : typeof map?.hasLayer === "function"
            ? map.hasLayer(popup)
            : true;
      if (!popupIsOpen) return false;
      map.closePopup();
      return true;
    };

    const expandStopEventNames = [
      "click",
      "dblclick",
      "mousedown",
      "mouseup",
      "pointerdown",
      "touchstart",
    ];
    let stopExpandEvent: ((event: Event) => void) | null = null;
    let onExpandClick: ((event: Event) => void) | null = null;

    if (expandButton instanceof HTMLButtonElement) {
      stopExpandEvent = (event) => {
        event.stopPropagation();
      };

      expandStopEventNames.forEach((eventName) => {
        if (stopExpandEvent)
          expandButton.addEventListener(eventName, stopExpandEvent);
      });

      onExpandClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const figure = viewport.closest("figure");
        const carouselRuntime = getFigcaptionCarouselRuntime();
        if (carouselRuntime && isMapFigure(figure)) {
          carouselRuntime.openFigure(figure);
        }
      };

      expandButton.addEventListener("click", onExpandClick);
    }

    const fitToBounds = (bounds: LatLngBounds | null) => {
      if (
        !bounds ||
        typeof bounds.isValid !== "function" ||
        !bounds.isValid()
      ) {
        return;
      }

      map?.fitBounds(bounds, {
        padding: [24, 24],
        // Prevent city-scale datasets from snapping to street-level zoom.
        maxZoom: 15,
      });
    };

    const applyThemeBasemap = () => {
      if (!L || !map) return;

      const nextTheme = getSiteTheme();
      if (baseTileLayer && baseTileTheme === nextTheme) return;

      const nextLayer = createBaseTileLayer(L, nextTheme);
      nextLayer.addTo(map);
      if (baseTileLayer && typeof map.removeLayer === "function") {
        map.removeLayer(baseTileLayer);
      }
      baseTileLayer = nextLayer;
      baseTileTheme = nextTheme;
    };

    const detachActiveGeoJsonLayer = () => {
      if (onOverlayLayerChange && typeof map?.off === "function") {
        map.off("overlayadd", onOverlayLayerChange);
        map.off("overlayremove", onOverlayLayerChange);
        onOverlayLayerChange = null;
      }
      try {
        removeLayerModeControl();
        removeLegendControl();
      } catch {
        // Leaflet controls may already be detached during re-render.
      }
      removeLayerModeControl = () => {};
      removeLegendControl = () => {};
      if (typeof map?.closePopup === "function") {
        map.closePopup();
      }
      try {
        spiderfier?.clearMarkers?.();
      } catch {
        // Spiderfier marker cleanup is best-effort only.
      }
      if (activeGeoJsonLayer && typeof map?.removeLayer === "function") {
        map.removeLayer(activeGeoJsonLayer);
      }
      activeGeoJsonLayer = null;
    };

    const getSearchResultMessage = (term: string, count: number) => {
      if (!term) return "";
      const safeCount = Number.isFinite(count) ? count : 0;
      if (safeCount === 0) return "No matching points";
      return (
        "Showing " +
        safeCount +
        " matching " +
        (safeCount === 1 ? "point" : "points")
      );
    };

    const renderGeoJsonData = (rawTerm: unknown) => {
      if (!L || !map || disposed) return { message: "" };
      const normalizedTerm = normalizeSearchTerm(rawTerm);
      const isSearch = normalizedTerm.length > 0;
      activeSearchTerm = normalizedTerm;
      detachActiveGeoJsonLayer();

      const filteredData = filterGeoJsonData(fullGeoJsonData, normalizedTerm);
      const {
        layer,
        sourcePointCount,
        renderedGeometryCount,
        fitBounds,
        legendEntries,
        layerToggleEntries,
      } = createGeoJsonLayer(L, filteredData, {
        showAlpha,
        showHexbin,
        showHulls,
        showPoints,
        showHeat,
        heatPaneName,
        spiderfier,
        hullData: isSearch ? fullGeoJsonData : null,
      });

      if (!renderedGeometryCount) {
        if (isSearch) {
          setState(viewport, "ready");
          return { message: getSearchResultMessage(normalizedTerm, 0) };
        }

        const emptyMessage = sourcePointCount
          ? "No renderable map features for current map options."
          : "No point features found in GeoJSON.";
        setState(viewport, "empty", emptyMessage);
        return { message: "" };
      }

      layer.addTo(map);
      activeGeoJsonLayer = layer;
      applyBaseLegendZOrder(map, legendEntries);

      if (typeof map.on === "function") {
        onOverlayLayerChange = () => {
          applyBaseLegendZOrder(map, legendEntries);
        };
        map.on("overlayadd", onOverlayLayerChange);
        map.on("overlayremove", onOverlayLayerChange);
      }

      removeLayerModeControl = createLayerModeControl(
        L,
        map,
        layerToggleEntries,
        {
          collapsedByDefault: !expandedViewport,
        },
      );
      if (showLegend) {
        removeLegendControl = createLegendControl(L, map, legendEntries, {
          collapsedByDefault: !expandedViewport,
        });
      } else {
        removeLegendControl = () => {};
      }

      fitToBounds(fitBounds);

      requestAnimationFrame(() => {
        if (!disposed) {
          map?.invalidateSize(false);
          fitToBounds(fitBounds);
        }
      });

      setState(viewport, "ready");
      return {
        message: getSearchResultMessage(normalizedTerm, sourcePointCount),
      };
    };

    const load = async () => {
      try {
        const response = await fetch(url, {
          signal: abortController?.signal,
        });
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        if (disposed || !L || !map) return;

        fullGeoJsonData = data;
        removeSearchControl = createSearchControl(L, map, (term) => {
          return renderGeoJsonData(term);
        });
        renderGeoJsonData(activeSearchTerm);
      } catch (error) {
        if (disposed) return;
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(logPrefix, "load failed", error);
        setState(viewport, "error", "Failed to load GeoJSON map data.");
      }
    };

    const start = async () => {
      try {
        L = await ensureLeaflet();
      } catch (error) {
        if (disposed) return;
        console.error(logPrefix, "Leaflet load failed", error);
        setState(viewport, "error", "Leaflet failed to load.");
        return;
      }

      if (showHeat) {
        try {
          await ensureLeafletHeat(L);
        } catch (error) {
          console.warn(logPrefix, "Leaflet.heat failed to load", error);
        }
      }

      let Spiderfier: SpiderfierConstructor | null = null;
      if (showPoints) {
        try {
          Spiderfier = await ensureLeafletSpiderfier();
        } catch (error) {
          console.warn(
            logPrefix,
            "OverlappingMarkerSpiderfier failed to load",
            error,
          );
        }
      }

      if (disposed) return;

      try {
        map = L.map(viewport, {
          scrollWheelZoom: expandedViewport,
        });
        if (Spiderfier) {
          spiderfier = new Spiderfier(map, {
            keepSpiderfied: true,
            nearbyDistance: spiderNearbyDistance,
          });
          if (
            spiderfier.legColors &&
            typeof spiderfier.legColors === "object"
          ) {
            spiderfier.legColors.highlighted = spiderfier.legColors.usual;
          }
          if (typeof spiderfier.addListener === "function") {
            spiderfier.addListener("click", (marker) => {
              const popupHtml = getMarkerPopupHtml(marker);
              if (
                !popupHtml ||
                !map ||
                typeof marker?.getLatLng !== "function"
              ) {
                return;
              }
              map.openPopup(popupHtml, marker.getLatLng());
            });
            spiderfier.addListener("spiderfy", (markers) => {
              if (typeof map?.closePopup === "function") {
                map.closePopup();
              }
              applySpiderLegColors(markers);
            });
          }
        }

        if (showHeat && typeof map.createPane === "function") {
          heatPaneName =
            "directive-map-heat-pane-" +
            Math.random().toString(36).slice(2, 10);
          const heatPane = map.createPane(heatPaneName);
          if (heatPane instanceof HTMLElement) {
            heatPane.style.zIndex = "390";
            heatPane.style.pointerEvents = "none";
          }
        }

        applyThemeBasemap();
        map.setView([0, 0], 1);

        onThemeChange = () => {
          if (disposed) return;
          applyThemeBasemap();
        };
        document.addEventListener("themechange", onThemeChange);
      } catch (error) {
        if (disposed) return;
        setState(viewport, "error", "Failed to initialize map.");
        return;
      }

      load();
    };

    start();

    return () => {
      disposed = true;
      if (expandButton instanceof HTMLButtonElement) {
        if (onExpandClick) {
          expandButton.removeEventListener("click", onExpandClick);
        }
        if (stopExpandEvent) {
          expandStopEventNames.forEach((eventName) => {
            if (stopExpandEvent)
              expandButton.removeEventListener(eventName, stopExpandEvent);
          });
        }
      }
      abortController?.abort();
      try {
        spiderfier?.clearListeners?.("click");
        spiderfier?.clearListeners?.("spiderfy");
        spiderfier?.clearMarkers?.();
      } catch {
        // Spiderfier teardown is best-effort only.
      }
      if (onThemeChange) {
        document.removeEventListener("themechange", onThemeChange);
      }
      try {
        detachActiveGeoJsonLayer();
        removeSearchControl();
        map?.remove?.();
      } finally {
        delete viewport.__directiveMapConsumeEscape;
        if (viewport.dataset?.[boundAttr] === "true") {
          delete viewport.dataset[boundAttr];
        }
      }
    };
  };

  const init = () => {
    if (!hasCleanupApi()) {
      scheduleInitWhenCleanupReady();
      return;
    }

    if (deferredInitFrame) {
      cancelAnimationFrame(deferredInitFrame);
      deferredInitFrame = 0;
    }

    const cleanups: Cleanup[] = [];
    const viewports = Array.from(
      document.querySelectorAll<MapViewport>(viewportSelector),
    );
    viewports.forEach((viewport) => {
      cleanups.push(bindViewport(viewport));
    });
    if (typeof window.addCleanup === "function") {
      window.addCleanup(() => cleanups.forEach((cleanup) => cleanup()));
    }
  };

  window.__directiveMapRuntime = {
    isMapFigure,
    prepareFigureForCarousel,
    bindFigure,
    consumeEscape,
  };

  document.addEventListener("nav", init);

  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }
}
