import { isRecord, type Feature, type ColorCount } from "./types.js";

export const isHexColor = (value: unknown): value is string => {
  return (
    typeof value === "string" && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value.trim())
  );
};

export const getFeatureColor = (feature: Feature | null) => {
  const properties = feature?.properties;
  if (!properties || typeof properties !== "object") return null;

  const districtColor = isRecord(properties.district)
    ? properties.district.color
    : null;

  const candidates = [
    properties["marker-color"],
    properties.markerColor,
    properties.color,
    districtColor,
  ];
  for (const candidate of candidates) {
    if (isHexColor(candidate)) {
      return candidate.trim();
    }
  }
  return null;
};

export const hexToRgb = (hex: unknown) => {
  if (!isHexColor(hex)) return null;
  const normalized = hex.trim().slice(1);
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalized;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

export const rgbToHex = (rgb: { r: number; g: number; b: number }) => {
  if (!rgb || typeof rgb !== "object") return null;
  const toHex = (value: number) => {
    const channel = clampNumber(Math.round(Number(value) || 0), 0, 255);
    return channel.toString(16).padStart(2, "0");
  };
  return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
};

export const blendHexColors = (entries: ColorCount[]) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  let totalWeight = 0;
  let red = 0;
  let green = 0;
  let blue = 0;

  entries.forEach((entry) => {
    const count = Number(entry?.count);
    const rgb = hexToRgb(entry?.color);
    if (!Number.isFinite(count) || count <= 0 || !rgb) return;
    totalWeight += count;
    red += rgb.r * count;
    green += rgb.g * count;
    blue += rgb.b * count;
  });

  if (totalWeight <= 0) return null;
  return rgbToHex({
    r: red / totalWeight,
    g: green / totalWeight,
    b: blue / totalWeight,
  });
};

export const buildHeatGradient = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return {
    0.25: "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0)",
    0.6: "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.55)",
    1.0: "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")",
  };
};

export const buildRgbaColor = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const safeAlpha = clampNumber(Number(alpha) || 0, 0, 1);
  return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + safeAlpha + ")";
};

export const clampNumber = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};
