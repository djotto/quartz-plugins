import type { LeafletApi, MapMarker, LatLng } from "./types.js";

import { isHexColor, buildRgbaColor } from "./colors.js";

export const setMarkerColor = (marker: MapMarker, color: string) => {
  if (!marker || typeof marker !== "object") return;
  if (isHexColor(color)) {
    marker.__directiveMapColor = color.trim();
  } else {
    delete marker.__directiveMapColor;
  }
};

export const getMarkerColor = (marker: MapMarker) => {
  const color = marker?.__directiveMapColor;
  return isHexColor(color) ? color.trim() : "#3388ff";
};

export const applySpiderLegColors = (markers: MapMarker[]) => {
  if (!Array.isArray(markers)) return;
  markers.forEach((marker) => {
    const leg = marker?._omsData?.leg;
    if (!leg || typeof leg.setStyle !== "function") return;
    leg.setStyle({ color: getMarkerColor(marker) });
  });
};

export const createPointMarker = (
  L: LeafletApi,
  latlng: LatLng,
  color: string,
) => {
  const strokeColor = isHexColor(color) ? color.trim() : "#3388ff";
  const fillColor =
    buildRgbaColor(strokeColor, 0.35) || "rgba(51, 136, 255, 0.35)";
  const marker = L.marker(latlng, {
    keyboard: true,
    riseOnHover: true,
    icon: L.divIcon({
      className: "directive-map__point-icon",
      html: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -7],
    }),
  });
  if (typeof marker.on === "function") {
    marker.on("add", () => {
      const markerElement =
        typeof marker.getElement === "function" ? marker.getElement() : null;
      if (markerElement instanceof HTMLElement) {
        markerElement.style.setProperty(
          "--directive-map-point-stroke",
          strokeColor,
        );
        markerElement.style.setProperty(
          "--directive-map-point-fill",
          fillColor,
        );
      }
    });
  }
  setMarkerColor(marker, strokeColor);
  return marker;
};

export const setMarkerPopupHtml = (marker: MapMarker, popupHtml: string) => {
  if (!marker || typeof marker !== "object") return;
  if (typeof popupHtml === "string" && popupHtml.length > 0) {
    marker.__directiveMapPopupHtml = popupHtml;
  } else {
    delete marker.__directiveMapPopupHtml;
  }
};

export const getMarkerPopupHtml = (marker: MapMarker) => {
  const popupHtml = marker?.__directiveMapPopupHtml;
  return typeof popupHtml === "string" && popupHtml.length > 0
    ? popupHtml
    : null;
};
