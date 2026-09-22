import type * as Leaflet from "leaflet";

export type LatLng = [number, number];
export type XY = { x: number; y: number };
export type Cleanup = () => void;
export type Feature = {
  type: "Feature";
  id?: unknown;
  geometry?: { type: string; coordinates?: unknown } | null;
  properties?: Record<string, unknown> | null;
};
export type PointEntry = { feature: Feature | null; latlng: LatLng };
export type HexPoint = {
  key: string;
  label: string;
  color: string;
  latlng: LatLng;
};
export type ColorCount = {
  color: string;
  count: number;
  label?: string;
  key?: string;
};
export type Projection = {
  referenceLat: number;
  referenceLon: number;
  project(latlng: LatLng): XY | null;
  unproject(point: XY): LatLng | null;
};
export type Hexbin = {
  centerProjected: XY;
  count: number;
  mixes: ColorCount[];
};
export type MapMarker = Leaflet.Marker & {
  __directiveMapColor?: string;
  __directiveMapPopupHtml?: string;
  _omsData?: { leg?: Leaflet.Polyline };
};
export interface Spiderfier {
  addMarker(marker: Leaflet.Marker): void;
  clearMarkers(): void;
  clearListeners(event: "click" | "spiderfy"): void;
  addListener(event: "click", listener: (marker: MapMarker) => void): void;
  addListener(
    event: "spiderfy",
    listener: (markers: MapMarker[]) => void,
  ): void;
  legColors?: { usual: string; highlighted: string };
}
export type SpiderfierConstructor = new (
  map: Leaflet.Map,
  options: { keepSpiderfied: boolean; nearbyDistance: number },
) => Spiderfier;
export type LeafletApi = typeof Leaflet & {
  heatLayer?: (
    points: [number, number, number][],
    options: {
      radius: number;
      blur: number;
      maxZoom: number;
      minOpacity: number;
      pane?: string;
      gradient?: Record<number, string>;
    },
  ) => Leaflet.Layer;
};
export type MapInstance = Leaflet.Map & { _popup?: Leaflet.Popup };
export type LayerKind = "points" | "hexbin" | "alpha" | "hulls" | "heat";
export type LegendMember = {
  type: LayerKind;
  layer: Leaflet.FeatureGroup;
  root: Leaflet.FeatureGroup;
};
export type LegendEntry = {
  key: string;
  label: string;
  color: string;
  count: number;
  memberLayers: LegendMember[];
};
export type LayerToggle = {
  key: LayerKind;
  label: string;
  layer: Leaflet.FeatureGroup;
};
export type MapViewport = HTMLElement & {
  __directiveMapConsumeEscape?: () => boolean;
};

declare global {
  interface Window {
    addCleanup(fn: (...args: unknown[]) => void): void;
    L?: LeafletApi;
    OverlappingMarkerSpiderfier?: SpiderfierConstructor;
    __figcaptionCarouselRuntime?: { openFigure(figure: HTMLElement): void };
    __directiveMapRuntime?: {
      isMapFigure(value: unknown): value is HTMLElement;
      prepareFigureForCarousel(figure: unknown): boolean;
      bindFigure(figure: unknown): Cleanup;
      consumeEscape(figure: unknown): boolean;
    };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isFeature(value: unknown): value is Feature {
  return (
    isRecord(value) &&
    value.type === "Feature" &&
    (value.properties == null || isRecord(value.properties)) &&
    (value.geometry == null ||
      (isRecord(value.geometry) && typeof value.geometry.type === "string"))
  );
}
