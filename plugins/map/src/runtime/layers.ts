import type { FeatureGroup } from "leaflet";
import type {
  LeafletApi,
  Spiderfier,
  LatLng,
  HexPoint,
  LayerToggle,
  LegendEntry,
  LegendMember,
} from "./types.js";

type LayerOptions = {
  showPoints?: boolean;
  showAlpha?: boolean;
  showHexbin?: boolean;
  showHulls?: boolean;
  showHeat?: boolean;
  heatPaneName?: string;
  spiderfier?: Spiderfier | null;
  hullData?: unknown;
};
type GroupEntry = {
  key: string;
  label: string;
  color: string;
  count: number;
  points: LatLng[];
  hullPoints: LatLng[];
  alphaPoints: LatLng[];
  hexbinLayer: FeatureGroup | null;
  pointLayer: FeatureGroup | null;
  alphaLayer: FeatureGroup | null;
  hullLayer: FeatureGroup | null;
  heatLayer: FeatureGroup | null;
};

import {
  collectGeoJsonPoints,
  isFeatureExcludedFromHull,
  getFeatureGroupLabel,
} from "./data.js";
import {
  getFeatureColor,
  blendHexColors,
  clampNumber,
  buildHeatGradient,
} from "./colors.js";
import { createPointMarker, setMarkerPopupHtml } from "./markers.js";
import { getFeaturePopupHtml, buildHexbinPopupHtml } from "./popups.js";
import {
  computeHexbins,
  buildHexagonLatLngs,
  computeConvexHull,
  computeAlphaShape,
} from "./geometry.js";

export const createGeoJsonLayer = (
  L: LeafletApi,
  data: unknown,
  options: LayerOptions | null = null,
) => {
  const showPoints = !(options && options.showPoints === false);
  const showAlpha = !(options && options.showAlpha === false);
  const showHexbin = !(options && options.showHexbin === false);
  const showHulls = !(options && options.showHulls === false);
  const heatPaneName =
    options &&
    typeof options.heatPaneName === "string" &&
    options.heatPaneName.trim().length > 0
      ? options.heatPaneName.trim()
      : "";
  const spiderfier =
    options &&
    options.spiderfier &&
    typeof options.spiderfier.addMarker === "function"
      ? options.spiderfier
      : null;
  const showHeat =
    !(options && options.showHeat === false) &&
    L &&
    typeof L.heatLayer === "function";
  const rootLayer = L.featureGroup();
  const pointsRootLayer = L.featureGroup();
  const hexbinRootLayer = L.featureGroup();
  const alphaRootLayer = L.featureGroup();
  const hullsRootLayer = L.featureGroup();
  const heatRootLayer = L.featureGroup();
  const groupedLayers = new Map<string, GroupEntry>();
  const hullSourceLayers = new Map<string, LatLng[]>();
  const hexbinPoints: HexPoint[] = [];
  let sourcePointCount = 0;
  let renderedGeometryCount = 0;

  if (showHeat) rootLayer.addLayer(heatRootLayer);
  if (showHexbin) rootLayer.addLayer(hexbinRootLayer);
  if (showHulls) rootLayer.addLayer(hullsRootLayer);
  if (showAlpha) rootLayer.addLayer(alphaRootLayer);
  if (showPoints) rootLayer.addLayer(pointsRootLayer);

  const points = collectGeoJsonPoints(data);
  const fitBounds =
    points.length > 0
      ? L.latLngBounds(points.map((point) => point.latlng))
      : null;

  if (options && options.hullData) {
    collectGeoJsonPoints(options.hullData).forEach(({ feature, latlng }) => {
      if (isFeatureExcludedFromHull(feature)) return;
      const color = getFeatureColor(feature) || "#3388ff";
      const label = getFeatureGroupLabel(feature) || "";
      const key = (label || "__ungrouped__") + "\u0000" + color;
      const entry = hullSourceLayers.get(key) ?? [];
      entry.push(latlng);
      hullSourceLayers.set(key, entry);
    });
  }

  points.forEach(({ feature, latlng }) => {
    sourcePointCount += 1;
    const color = getFeatureColor(feature) || "#3388ff";
    const label = getFeatureGroupLabel(feature) || "";
    const key = (label || "__ungrouped__") + "\u0000" + color;
    const sourceHullPoints = hullSourceLayers.get(key);

    let entry = groupedLayers.get(key);
    if (!entry) {
      entry = {
        key,
        label,
        color,
        count: 0,
        points: [],
        hullPoints: Array.isArray(sourceHullPoints)
          ? sourceHullPoints.slice()
          : [],
        alphaPoints: [],
        hexbinLayer: showHexbin ? L.featureGroup() : null,
        pointLayer: showPoints ? L.featureGroup() : null,
        alphaLayer: showAlpha ? L.featureGroup() : null,
        hullLayer: showHulls ? L.featureGroup() : null,
        heatLayer: showHeat ? L.featureGroup() : null,
      };
      groupedLayers.set(key, entry);
    }

    if (showPoints) {
      const marker = createPointMarker(L, latlng, color);

      const popupHtml = getFeaturePopupHtml(feature);
      if (popupHtml && !spiderfier && typeof marker.bindPopup === "function") {
        marker.bindPopup(popupHtml);
      }
      if (popupHtml && spiderfier) {
        setMarkerPopupHtml(marker, popupHtml);
      }

      if (entry.pointLayer) {
        if (
          typeof pointsRootLayer.hasLayer !== "function" ||
          !pointsRootLayer.hasLayer(entry.pointLayer)
        ) {
          pointsRootLayer.addLayer(entry.pointLayer);
        }
        entry.pointLayer.addLayer(marker);
        if (spiderfier) {
          spiderfier.addMarker(marker);
        }
        renderedGeometryCount += 1;
      }
    }

    entry.points.push(latlng);
    if (!isFeatureExcludedFromHull(feature)) {
      if (!sourceHullPoints) entry.hullPoints.push(latlng);
      entry.alphaPoints.push(latlng);
    }
    entry.count += 1;
    hexbinPoints.push({
      key,
      label,
      color,
      latlng,
    });
  });

  const legendEntries = Array.from(groupedLayers.values());
  if (showHexbin) {
    const sharedHexbinLayer = L.featureGroup();
    const { bins, radius, projection } = computeHexbins(hexbinPoints);
    if (
      Array.isArray(bins) &&
      bins.length > 0 &&
      radius !== null &&
      Number.isFinite(radius) &&
      projection
    ) {
      const maxCount = bins.reduce((currentMax, bin) => {
        return Math.max(currentMax, Number(bin?.count) || 0);
      }, 0);

      if (maxCount > 0) {
        bins.forEach((bin) => {
          const latlngs = buildHexagonLatLngs(
            bin.centerProjected,
            radius,
            projection,
          );
          if (!latlngs) return;

          const fillColor = blendHexColors(bin.mixes) || "#3388ff";
          const relativeCount = clampNumber(bin.count / maxCount, 0, 1);
          const fillOpacity = 0.14 + relativeCount * 0.42;
          const hexbinLayer = L.polygon(latlngs, {
            color: fillColor,
            weight: 1.2,
            opacity: 0.75,
            fillColor,
            fillOpacity,
          });

          const popupHtml = buildHexbinPopupHtml(bin);
          if (popupHtml && typeof hexbinLayer.bindPopup === "function") {
            hexbinLayer.bindPopup(popupHtml);
          }

          sharedHexbinLayer.addLayer(hexbinLayer);
          renderedGeometryCount += 1;
        });

        if (
          typeof hexbinRootLayer.hasLayer !== "function" ||
          !hexbinRootLayer.hasLayer(sharedHexbinLayer)
        ) {
          hexbinRootLayer.addLayer(sharedHexbinLayer);
        }
      }
    }
  }

  if (showHulls) {
    legendEntries.forEach((entry) => {
      const hullLatlngs = computeConvexHull(entry.hullPoints);
      if (!hullLatlngs) return;

      const hullLayer = L.polygon(hullLatlngs, {
        color: entry.color,
        weight: 2,
        opacity: 1,
        fill: false,
      });
      if (entry.hullLayer) {
        if (
          typeof hullsRootLayer.hasLayer !== "function" ||
          !hullsRootLayer.hasLayer(entry.hullLayer)
        ) {
          hullsRootLayer.addLayer(entry.hullLayer);
        }
        entry.hullLayer.addLayer(hullLayer);
        renderedGeometryCount += 1;
      }
      if (typeof hullLayer.bringToBack === "function") {
        hullLayer.bringToBack();
      }
    });
  }

  if (showAlpha) {
    legendEntries.forEach((entry) => {
      if (!entry.alphaLayer) return;
      const alphaLoops = computeAlphaShape(entry.alphaPoints);
      if (alphaLoops.length === 0) return;

      if (
        typeof alphaRootLayer.hasLayer !== "function" ||
        !alphaRootLayer.hasLayer(entry.alphaLayer)
      ) {
        alphaRootLayer.addLayer(entry.alphaLayer);
      }

      alphaLoops.forEach((alphaLatlngs) => {
        const alphaLayer = L.polygon(alphaLatlngs, {
          color: entry.color,
          weight: 2.4,
          opacity: 0.95,
          fillColor: entry.color,
          fillOpacity: 0.08,
          dashArray: "6 4",
        });
        entry.alphaLayer?.addLayer(alphaLayer);
        renderedGeometryCount += 1;
      });
    });
  }

  const heatLayerFactory = L.heatLayer;
  if (showHeat && heatLayerFactory) {
    legendEntries.forEach((entry) => {
      if (!Array.isArray(entry.points) || entry.points.length === 0) return;
      const gradient = buildHeatGradient(entry.color);
      const heatLayer = heatLayerFactory(
        entry.points.map((latlng) => [latlng[0], latlng[1], 0.7]),
        {
          radius: 22,
          blur: 16,
          maxZoom: 18,
          minOpacity: 0.2,
          ...(heatPaneName ? { pane: heatPaneName } : {}),
          ...(gradient ? { gradient } : {}),
        },
      );
      if (entry.heatLayer) {
        if (
          typeof heatRootLayer.hasLayer !== "function" ||
          !heatRootLayer.hasLayer(entry.heatLayer)
        ) {
          heatRootLayer.addLayer(entry.heatLayer);
        }
        entry.heatLayer.addLayer(heatLayer);
        renderedGeometryCount += 1;
      }
    });
  }

  const layerToggleEntries: LayerToggle[] = [];
  if (
    showPoints &&
    typeof pointsRootLayer.getLayers === "function" &&
    pointsRootLayer.getLayers().length > 0
  ) {
    layerToggleEntries.push({
      key: "points",
      label: "Points",
      layer: pointsRootLayer,
    });
  }
  if (
    showHexbin &&
    typeof hexbinRootLayer.getLayers === "function" &&
    hexbinRootLayer.getLayers().length > 0
  ) {
    layerToggleEntries.push({
      key: "hexbin",
      label: "Hexbin",
      layer: hexbinRootLayer,
    });
  }
  if (
    showHulls &&
    typeof hullsRootLayer.getLayers === "function" &&
    hullsRootLayer.getLayers().length > 0
  ) {
    layerToggleEntries.push({
      key: "hulls",
      label: "Hulls",
      layer: hullsRootLayer,
    });
  }
  if (
    showAlpha &&
    typeof alphaRootLayer.getLayers === "function" &&
    alphaRootLayer.getLayers().length > 0
  ) {
    layerToggleEntries.push({
      key: "alpha",
      label: "α-shape",
      layer: alphaRootLayer,
    });
  }
  if (
    showHeat &&
    typeof heatRootLayer.getLayers === "function" &&
    heatRootLayer.getLayers().length > 0
  ) {
    layerToggleEntries.push({
      key: "heat",
      label: "Heat",
      layer: heatRootLayer,
    });
  }

  const finalizedLegendEntries: LegendEntry[] = legendEntries.map((entry) => {
    const memberLayers: LegendMember[] = [];
    if (
      entry.hexbinLayer &&
      typeof entry.hexbinLayer.getLayers === "function" &&
      entry.hexbinLayer.getLayers().length > 0
    ) {
      memberLayers.push({
        type: "hexbin",
        layer: entry.hexbinLayer,
        root: hexbinRootLayer,
      });
    }
    if (
      entry.pointLayer &&
      typeof entry.pointLayer.getLayers === "function" &&
      entry.pointLayer.getLayers().length > 0
    ) {
      memberLayers.push({
        type: "points",
        layer: entry.pointLayer,
        root: pointsRootLayer,
      });
    }
    if (
      entry.alphaLayer &&
      typeof entry.alphaLayer.getLayers === "function" &&
      entry.alphaLayer.getLayers().length > 0
    ) {
      memberLayers.push({
        type: "alpha",
        layer: entry.alphaLayer,
        root: alphaRootLayer,
      });
    }
    if (
      entry.hullLayer &&
      typeof entry.hullLayer.getLayers === "function" &&
      entry.hullLayer.getLayers().length > 0
    ) {
      memberLayers.push({
        type: "hulls",
        layer: entry.hullLayer,
        root: hullsRootLayer,
      });
    }
    if (
      entry.heatLayer &&
      typeof entry.heatLayer.getLayers === "function" &&
      entry.heatLayer.getLayers().length > 0
    ) {
      memberLayers.push({
        type: "heat",
        layer: entry.heatLayer,
        root: heatRootLayer,
      });
    }
    return {
      key: entry.key,
      label: entry.label,
      color: entry.color,
      count: entry.count,
      memberLayers,
    };
  });

  return {
    layer: rootLayer,
    sourcePointCount,
    renderedGeometryCount,
    fitBounds,
    legendEntries: finalizedLegendEntries,
    layerToggleEntries,
  };
};
