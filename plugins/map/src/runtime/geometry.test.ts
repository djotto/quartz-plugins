import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalProjection,
  computeConvexHull,
  computeAlphaShape,
  computeHexbins,
  buildHexagonLatLngs,
  getPolygonArea,
} from "./geometry.js";
import { blendHexColors } from "./colors.js";
import type { LatLng } from "./types.js";

test("local projection round-trips coordinates and rejects non-finite input", () => {
  const points: LatLng[] = [
    [50.8, -1.1],
    [50.9, -1],
  ];
  const projection = createLocalProjection(points);
  assert.ok(projection);
  for (const point of points) {
    const projected = projection.project(point);
    assert.ok(projected);
    assert.deepEqual(projection.unproject(projected), point);
  }
  assert.equal(projection.project([NaN, 0]), null);
  assert.equal(createLocalProjection([]), null);
});

test("hulls discard duplicates and interior points, and handle degenerate data", () => {
  const square: LatLng[] = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  const hull = computeConvexHull([...square, [0.5, 0.5], [0, 0], [NaN, 0]]);
  assert.ok(hull);
  assert.equal(hull.length, 4);
  assert.equal(Math.abs(getPolygonArea(hull)), 1);
  assert.deepEqual(new Set(hull.map(String)), new Set(square.map(String)));
  assert.equal(
    computeConvexHull([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    null,
  );
  assert.equal(
    computeConvexHull([
      [0, 0],
      [0, 0],
    ]),
    null,
  );
});

test("alpha shapes enclose a square and safely handle collinear points", () => {
  const loops = computeAlphaShape([
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0.5, 0.5],
  ]);
  assert.equal(loops.length, 1);
  assert.equal(Math.abs(getPolygonArea(loops[0])), 1);
  assert.deepEqual(computeAlphaShape([]), []);
  assert.deepEqual(
    computeAlphaShape([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
    [],
  );
});

test("hexbins preserve point totals and district mixtures, including coincident points", () => {
  const { bins, radius, projection } = computeHexbins([
    { key: "a", label: "A", color: "#ff0000", latlng: [50.8, -1.1] },
    { key: "a", label: "A", color: "#ff0000", latlng: [50.8, -1.1] },
    { key: "b", label: "B", color: "#0000ff", latlng: [50.8, -1.1] },
  ]);
  assert.equal(bins.length, 1);
  assert.equal(bins[0].count, 3);
  assert.deepEqual(
    bins[0].mixes.map(({ key, count }) => [key, count]),
    [
      ["a", 2],
      ["b", 1],
    ],
  );
  assert.equal(blendHexColors(bins[0].mixes), "#aa0055");
  assert.ok(radius && projection);
  const corners = buildHexagonLatLngs(
    bins[0].centerProjected,
    radius,
    projection,
  );
  assert.equal(corners?.length, 6);
  assert.ok(corners?.flat().every(Number.isFinite));
  assert.deepEqual(computeHexbins([]), {
    bins: [],
    radius: null,
    projection: null,
  });
});
