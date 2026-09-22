import assert from "node:assert/strict";
import test from "node:test";
import {
  collectGeoJsonPoints,
  filterGeoJsonData,
  normalizeSearchTerm,
  getFeatureGroupLabel,
  isFeatureExcludedFromHull,
  parseDataBoolean,
} from "./data.js";
import { getFeatureColor } from "./colors.js";
import type { Feature } from "./types.js";

const point: Feature = {
  type: "Feature",
  id: "place-42",
  geometry: { type: "Point", coordinates: [-1.1, 50.8] },
  properties: {
    district: { name: "Hilsea", color: "#123456" },
    address: { multiline: "1 Example Road\nPortsmouth" },
    postcards: [{ recipient: "Alice Smith", notes: "Posted in June" }],
  },
};

test("reads Point, MultiPoint and bare geometries in Leaflet coordinate order", () => {
  const multi: Feature = {
    ...point,
    geometry: {
      type: "MultiPoint",
      coordinates: [[-1, 51], [-2, 52], [], ["bad", 50]],
    },
  };
  const points = collectGeoJsonPoints({
    type: "FeatureCollection",
    features: [
      point,
      multi,
      null,
      { type: "Feature", geometry: null },
      { type: "garbage" },
    ],
  });
  assert.deepEqual(
    points.map((entry) => entry.latlng),
    [
      [50.8, -1.1],
      [51, -1],
      [52, -2],
    ],
  );
  assert.equal(points[0].feature, point);
  assert.deepEqual(
    collectGeoJsonPoints({ type: "Point", coordinates: [-1, 51] }),
    [{ feature: null, latlng: [51, -1] }],
  );
  assert.equal(
    collectGeoJsonPoints({ type: "MultiPoint", coordinates: [[-1, 51]] })
      .length,
    1,
  );
  assert.deepEqual(
    collectGeoJsonPoints({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
    }),
    [],
  );
  assert.throws(() => collectGeoJsonPoints(null), /GeoJSON must be/);
  assert.throws(() => collectGeoJsonPoints({}), /GeoJSON must be/);
});

test("searches nested text and feature IDs without mutating the source", () => {
  const other: Feature = {
    ...point,
    id: "other",
    properties: { address: "Southsea" },
  };
  const data = {
    type: "FeatureCollection",
    features: [point, other],
    attribution: "Example",
  };
  for (const term of [
    " ALICE ",
    "example road",
    "hilsea",
    "place-42",
    "june",
  ]) {
    const filtered = filterGeoJsonData(data, normalizeSearchTerm(term));
    assert.deepEqual(filtered, { ...data, features: [point] });
  }
  assert.equal(filterGeoJsonData(data, ""), data);
  assert.deepEqual(filterGeoJsonData(point, "southsea"), {
    type: "FeatureCollection",
    features: [],
  });
  assert.equal(
    collectGeoJsonPoints(filterGeoJsonData(data, "absent")).length,
    0,
  );
  assert.equal(data.features.length, 2);
  assert.deepEqual(
    filterGeoJsonData({ type: "Point", coordinates: [-1, 51] }, "alice"),
    {
      type: "FeatureCollection",
      features: [],
    },
  );
});

test("keeps district styling, hull exclusions and directive boolean defaults", () => {
  assert.equal(getFeatureGroupLabel(point), "Hilsea");
  assert.equal(getFeatureColor(point), "#123456");
  assert.equal(
    getFeatureColor({ ...point, properties: { color: "red; display:none" } }),
    null,
  );
  assert.equal(
    isFeatureExcludedFromHull({
      ...point,
      properties: { exclude_from_hulls: " TRUE " },
    }),
    true,
  );
  assert.equal(
    isFeatureExcludedFromHull({ ...point, properties: { exclude: true } }),
    true,
  );
  assert.equal(isFeatureExcludedFromHull(point), false);
  assert.equal(parseDataBoolean("no"), false);
  assert.equal(parseDataBoolean("1", false), true);
  assert.equal(parseDataBoolean(undefined, false), false);
});
