import { isRecord, isFeature, type Feature, type PointEntry } from "./types.js";

export const pointGeometryTypes = new Set(["Point", "MultiPoint"]);

export const isPointFeature = (feature: Feature | null) => {
  const type = feature?.geometry?.type;
  return typeof type === "string" && pointGeometryTypes.has(type);
};

export const isBarePointGeometry = (
  value: unknown,
): value is { type: "Point" | "MultiPoint"; coordinates: unknown } => {
  const type = isRecord(value) ? value.type : undefined;
  return typeof type === "string" && pointGeometryTypes.has(type);
};

export const getFeatureGroupLabel = (feature: Feature | null) => {
  const properties = feature?.properties;
  if (!properties || typeof properties !== "object") return null;

  const districtName = isRecord(properties.district)
    ? properties.district.name
    : null;

  const candidates = [
    properties.group,
    districtName,
    properties.district,
    properties.area,
    properties.label,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

export const parseFeatureBoolean = (value: unknown) => {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase() === "true";
};

export const isFeatureExcludedFromHull = (feature: Feature | null) => {
  const properties = feature?.properties;
  if (!properties || typeof properties !== "object") return false;

  return (
    parseFeatureBoolean(properties.exclude) ||
    parseFeatureBoolean(properties.exclude_from_hulls)
  );
};

export const parseDataBoolean = (value: unknown, defaultValue = true) => {
  if (typeof value !== "string") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["on", "true", "1", "yes"].includes(normalized)) return true;
  if (["off", "false", "0", "no"].includes(normalized)) return false;
  return defaultValue;
};

export const normalizeSearchTerm = (value: unknown) => {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
};

export const collectTextFields = (value: unknown, textFields: string[]) => {
  if (!textFields) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) textFields.push(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectTextFields(entry, textFields));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach((entry) => collectTextFields(entry, textFields));
};

export const featureMatchesSearch = (
  feature: Feature,
  normalizedTerm: string,
) => {
  if (!normalizedTerm) return true;
  const textFields: string[] = [];
  collectTextFields(feature?.properties, textFields);
  if (typeof feature?.id === "string") {
    textFields.push(feature.id);
  }
  return textFields.some((value) => {
    return value.toLowerCase().includes(normalizedTerm);
  });
};

export const filterGeoJsonData = (
  data: unknown,
  normalizedTerm: string,
): unknown => {
  if (!normalizedTerm) return data;
  if (
    isRecord(data) &&
    data.type === "FeatureCollection" &&
    Array.isArray(data.features)
  ) {
    return {
      ...data,
      features: data.features.filter(
        (feature: unknown) =>
          isFeature(feature) && featureMatchesSearch(feature, normalizedTerm),
      ),
    };
  }
  if (isFeature(data)) {
    return featureMatchesSearch(data, normalizedTerm)
      ? data
      : { type: "FeatureCollection", features: [] };
  }
  return { type: "FeatureCollection", features: [] };
};

export const pushPointFromCoordinates = (
  points: PointEntry[],
  feature: Feature | null,
  coordinates: unknown,
) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return;
  const lon = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  points.push({ feature, latlng: [lat, lon] });
};

export const collectGeoJsonPoints = (data: unknown): PointEntry[] => {
  const points: PointEntry[] = [];

  const addFeaturePoints = (feature: unknown) => {
    if (!isFeature(feature) || !isPointFeature(feature)) return;
    const geometry = feature?.geometry;
    if (!geometry || typeof geometry !== "object") return;

    if (geometry.type === "Point") {
      pushPointFromCoordinates(points, feature, geometry.coordinates);
      return;
    }

    if (geometry.type === "MultiPoint" && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach((coordinates) => {
        pushPointFromCoordinates(points, feature, coordinates);
      });
    }
  };

  if (
    isRecord(data) &&
    data.type === "FeatureCollection" &&
    Array.isArray(data.features)
  ) {
    data.features.forEach(addFeaturePoints);
    return points;
  }

  if (isFeature(data)) {
    addFeaturePoints(data);
    return points;
  }

  if (isBarePointGeometry(data)) {
    if (data.type === "Point") {
      pushPointFromCoordinates(points, null, data.coordinates);
    } else if (Array.isArray(data.coordinates)) {
      data.coordinates.forEach((coordinates) => {
        pushPointFromCoordinates(points, null, coordinates);
      });
    }
    return points;
  }

  throw new Error(
    "GeoJSON must be a Feature/FeatureCollection with Point features",
  );
};
