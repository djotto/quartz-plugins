import type { LatLng, XY, HexPoint, Projection, ColorCount } from "./types.js";

type Coordinate = { lat: number; lon: number };
type Triangle = {
  a: number;
  b: number;
  c: number;
  circumcenter: Coordinate;
  circumradius2: number;
};
type Bin = {
  key: string;
  q: number;
  r: number;
  count: number;
  center: LatLng;
  centerProjected: XY;
  mixes: Map<string, ColorCount>;
};

import { clampNumber } from "./colors.js";

export const METERS_PER_DEGREE_LAT = 111132;

export const getLongitudeMetersPerDegree = (latitude: number) => {
  if (!Number.isFinite(latitude)) return 1e-6;
  return Math.max(
    Math.abs(Math.cos((latitude * Math.PI) / 180) * 111320),
    1e-6,
  );
};

export const createLocalProjection = (latlngs: LatLng[]): Projection | null => {
  if (!Array.isArray(latlngs) || latlngs.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let validCount = 0;

  latlngs.forEach((latlng) => {
    if (!Array.isArray(latlng) || latlng.length < 2) return;
    const lat = Number(latlng[0]);
    const lon = Number(latlng[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    validCount += 1;
  });

  if (validCount === 0) return null;

  const referenceLat = (minLat + maxLat) / 2;
  const referenceLon = (minLon + maxLon) / 2;
  const lonMetersPerDegree = getLongitudeMetersPerDegree(referenceLat);

  return {
    referenceLat,
    referenceLon,
    project(latlng: LatLng) {
      if (!Array.isArray(latlng) || latlng.length < 2) return null;
      const lat = Number(latlng[0]);
      const lon = Number(latlng[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return {
        x: (lon - referenceLon) * lonMetersPerDegree,
        y: (lat - referenceLat) * METERS_PER_DEGREE_LAT,
      };
    },
    unproject(point: XY) {
      if (!point || typeof point !== "object") return null;
      const x = Number(point.x);
      const y = Number(point.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return [
        referenceLat + y / METERS_PER_DEGREE_LAT,
        referenceLon + x / lonMetersPerDegree,
      ];
    },
  };
};

export const roundHexCube = (q: number, r: number) => {
  let x = q;
  let z = r;
  let y = -x - z;

  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
};

export const computeHexbins = (pointEntries: HexPoint[]) => {
  if (!Array.isArray(pointEntries) || pointEntries.length === 0) {
    return { bins: [], radius: null, projection: null };
  }

  const projection = createLocalProjection(
    pointEntries.map((entry) => entry?.latlng),
  );
  if (!projection) {
    return { bins: [], radius: null, projection: null };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const points: (XY & Omit<HexPoint, "latlng">)[] = [];

  pointEntries.forEach((entry) => {
    const projected = projection.project(entry?.latlng);
    if (!projected) return;
    const x = Number(projected.x);
    const y = Number(projected.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    points.push({
      key: typeof entry?.key === "string" ? entry.key : "__ungrouped__",
      label: typeof entry?.label === "string" ? entry.label : "",
      color: typeof entry?.color === "string" ? entry.color : "",
      x,
      y,
    });
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  if (points.length === 0) {
    return { bins: [], radius: null, projection: null };
  }

  const spanX = Math.max(maxX - minX, 0);
  const spanY = Math.max(maxY - minY, 0);
  const span = Math.max(spanX, spanY, 1);
  const targetBinsAcross = clampNumber(
    Math.round(Math.sqrt(points.length) * 0.9),
    4,
    11,
  );
  const radius = span / (Math.max(1, targetBinsAcross) * Math.sqrt(3));
  const safeRadius = Math.max(Math.max(radius, span / 120, 1) * 0.5, 0.5);
  const binsByKey = new Map<string, Bin>();

  points.forEach((point) => {
    const fractionalQ =
      ((Math.sqrt(3) / 3) * point.x - point.y / 3) / safeRadius;
    const fractionalR = ((2 / 3) * point.y) / safeRadius;
    const axial = roundHexCube(fractionalQ, fractionalR);
    const key = axial.q + ":" + axial.r;

    let entry = binsByKey.get(key);
    if (!entry) {
      const centerProjected = {
        x: safeRadius * Math.sqrt(3) * (axial.q + axial.r / 2),
        y: safeRadius * 1.5 * axial.r,
      };
      const center = projection.unproject(centerProjected);
      if (!center) return;
      entry = {
        key,
        q: axial.q,
        r: axial.r,
        count: 0,
        center,
        centerProjected,
        mixes: new Map(),
      };
      binsByKey.set(key, entry);
    }

    entry.count += 1;
    let mixEntry = entry.mixes.get(point.key);
    if (!mixEntry) {
      mixEntry = {
        key: point.key,
        label: point.label,
        color: point.color,
        count: 0,
      };
      entry.mixes.set(point.key, mixEntry);
    }
    mixEntry.count += 1;
  });

  const bins = Array.from(binsByKey.values()).map((entry) => {
    return {
      key: entry.key,
      q: entry.q,
      r: entry.r,
      count: entry.count,
      center: entry.center,
      centerProjected: entry.centerProjected,
      mixes: Array.from(entry.mixes.values()).sort((left, right) => {
        return right.count - left.count;
      }),
    };
  });
  return { bins, radius: safeRadius, projection };
};

export const buildHexagonLatLngs = (
  centerProjected: XY,
  radius: number,
  projection: Projection,
) => {
  if (!centerProjected || typeof centerProjected !== "object" || !projection) {
    return null;
  }
  const centerX = Number(centerProjected.x);
  const centerY = Number(centerProjected.y);
  if (
    !Number.isFinite(centerX) ||
    !Number.isFinite(centerY) ||
    !Number.isFinite(radius) ||
    radius <= 0
  ) {
    return null;
  }

  const corners = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    const latlng = projection.unproject({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
    if (!latlng) return null;
    corners.push(latlng);
  }
  return corners;
};

export const getPolygonArea = (latlngs: LatLng[]) => {
  if (!Array.isArray(latlngs) || latlngs.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < latlngs.length; i += 1) {
    const current = latlngs[i];
    const next = latlngs[(i + 1) % latlngs.length];
    if (!Array.isArray(current) || !Array.isArray(next)) continue;
    const currentLon = Number(current[1]);
    const currentLat = Number(current[0]);
    const nextLon = Number(next[1]);
    const nextLat = Number(next[0]);
    if (
      !Number.isFinite(currentLon) ||
      !Number.isFinite(currentLat) ||
      !Number.isFinite(nextLon) ||
      !Number.isFinite(nextLat)
    ) {
      continue;
    }
    area += currentLon * nextLat - nextLon * currentLat;
  }
  return area / 2;
};

export const computeConvexHull = (latlngs: LatLng[]): LatLng[] | null => {
  if (!Array.isArray(latlngs)) return null;

  const uniquePoints = new Map<string, Coordinate>();
  latlngs.forEach((latlng) => {
    if (!Array.isArray(latlng) || latlng.length < 2) return;
    const lat = Number(latlng[0]);
    const lon = Number(latlng[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    uniquePoints.set(lon + "," + lat, { lat, lon });
  });

  const points = Array.from(uniquePoints.values());
  if (points.length < 3) return null;

  points.sort((a, b) => {
    if (a.lon !== b.lon) return a.lon - b.lon;
    return a.lat - b.lat;
  });

  const cross = (o: Coordinate, a: Coordinate, b: Coordinate) => {
    return (
      (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon)
    );
  };

  const lower: Coordinate[] = [];
  points.forEach((point) => {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper: Coordinate[] = [];
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const point = points[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }

  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  if (hull.length < 3) return null;

  return hull.map((point) => [point.lat, point.lon]);
};

export const computeAlphaShape = (latlngs: LatLng[]): LatLng[][] => {
  if (!Array.isArray(latlngs)) return [];

  const uniquePointMap = new Map<string, Coordinate>();
  latlngs.forEach((latlng) => {
    if (!Array.isArray(latlng) || latlng.length < 2) return;
    const lat = Number(latlng[0]);
    const lon = Number(latlng[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    uniquePointMap.set(lon + "," + lat, { lat, lon });
  });

  const points = Array.from(uniquePointMap.values());
  if (points.length < 3) return [];
  if (points.length === 3) {
    const hull = computeConvexHull(latlngs);
    return hull ? [hull] : [];
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  points.forEach((point) => {
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
  });

  const span = Math.max(maxLon - minLon, maxLat - minLat, 1);
  const epsilon = Math.max(1e-12, span * span * 1e-12);
  const superScale = span * 20;
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const basePointCount = points.length;
  const triangulationPoints = points.concat([
    { lon: centerLon - superScale, lat: centerLat - span },
    { lon: centerLon, lat: centerLat + superScale },
    { lon: centerLon + superScale, lat: centerLat - span },
  ]);

  const normalizeEdgeKey = (a: number, b: number) => {
    return a < b ? a + ":" + b : b + ":" + a;
  };

  const createTriangle = (aIndex: number, bIndex: number, cIndex: number) => {
    const pointA = triangulationPoints[aIndex];
    const pointB = triangulationPoints[bIndex];
    const pointC = triangulationPoints[cIndex];
    if (!pointA || !pointB || !pointC) return null;

    const cross =
      (pointB.lon - pointA.lon) * (pointC.lat - pointA.lat) -
      (pointB.lat - pointA.lat) * (pointC.lon - pointA.lon);
    if (Math.abs(cross) <= epsilon) return null;

    const ordered =
      cross > 0 ? [aIndex, bIndex, cIndex] : [aIndex, cIndex, bIndex];
    const pa = triangulationPoints[ordered[0]];
    const pb = triangulationPoints[ordered[1]];
    const pc = triangulationPoints[ordered[2]];
    const denominator =
      2 *
      (pa.lon * (pb.lat - pc.lat) +
        pb.lon * (pc.lat - pa.lat) +
        pc.lon * (pa.lat - pb.lat));
    if (!Number.isFinite(denominator) || Math.abs(denominator) <= epsilon) {
      return null;
    }

    const centerLonNumerator =
      (pa.lon * pa.lon + pa.lat * pa.lat) * (pb.lat - pc.lat) +
      (pb.lon * pb.lon + pb.lat * pb.lat) * (pc.lat - pa.lat) +
      (pc.lon * pc.lon + pc.lat * pc.lat) * (pa.lat - pb.lat);
    const centerLatNumerator =
      (pa.lon * pa.lon + pa.lat * pa.lat) * (pc.lon - pb.lon) +
      (pb.lon * pb.lon + pb.lat * pb.lat) * (pa.lon - pc.lon) +
      (pc.lon * pc.lon + pc.lat * pc.lat) * (pb.lon - pa.lon);
    const circumcenter = {
      lon: centerLonNumerator / denominator,
      lat: centerLatNumerator / denominator,
    };
    const dx = circumcenter.lon - pa.lon;
    const dy = circumcenter.lat - pa.lat;
    const circumradius2 = dx * dx + dy * dy;
    if (!Number.isFinite(circumradius2)) return null;

    return {
      a: ordered[0],
      b: ordered[1],
      c: ordered[2],
      circumcenter,
      circumradius2,
    };
  };

  let triangles: Triangle[] = [];
  const seedTriangle = createTriangle(
    basePointCount,
    basePointCount + 1,
    basePointCount + 2,
  );
  if (!seedTriangle) {
    const hull = computeConvexHull(latlngs);
    return hull ? [hull] : [];
  }
  triangles.push(seedTriangle);

  for (let pointIndex = 0; pointIndex < basePointCount; pointIndex += 1) {
    const point = triangulationPoints[pointIndex];
    const badTriangleIndexes: number[] = [];

    triangles.forEach((triangle, triangleIndex) => {
      const dx = point.lon - triangle.circumcenter.lon;
      const dy = point.lat - triangle.circumcenter.lat;
      const distance2 = dx * dx + dy * dy;
      if (distance2 <= triangle.circumradius2 + epsilon) {
        badTriangleIndexes.push(triangleIndex);
      }
    });

    if (badTriangleIndexes.length === 0) continue;

    const boundaryEdges = new Map<string, [number, number]>();
    const badTriangleIndexSet = new Set(badTriangleIndexes);
    badTriangleIndexes.forEach((triangleIndex) => {
      const triangle = triangles[triangleIndex];
      if (!triangle) return;
      [
        [triangle.a, triangle.b],
        [triangle.b, triangle.c],
        [triangle.c, triangle.a],
      ].forEach(([start, end]) => {
        const key = normalizeEdgeKey(start, end);
        if (boundaryEdges.has(key)) {
          boundaryEdges.delete(key);
        } else {
          boundaryEdges.set(key, [start, end]);
        }
      });
    });

    triangles = triangles.filter((_, triangleIndex) => {
      return !badTriangleIndexSet.has(triangleIndex);
    });

    boundaryEdges.forEach(([start, end]) => {
      const triangle = createTriangle(start, end, pointIndex);
      if (triangle) {
        triangles.push(triangle);
      }
    });
  }

  const interiorTriangles = triangles.filter((triangle) => {
    return (
      triangle.a < basePointCount &&
      triangle.b < basePointCount &&
      triangle.c < basePointCount
    );
  });
  if (interiorTriangles.length === 0) {
    const hull = computeConvexHull(latlngs);
    return hull ? [hull] : [];
  }

  const quantile = (values: number[], q: number) => {
    if (!Array.isArray(values) || values.length === 0) return null;
    const sorted = values
      .filter((value) => Number.isFinite(value))
      .slice()
      .sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    if (sorted.length === 1) return sorted[0];
    const position = Math.min(
      sorted.length - 1,
      Math.max(0, (sorted.length - 1) * q),
    );
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) return sorted[lowerIndex];
    const weight = position - lowerIndex;
    return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
  };

  const nearestNeighborDistances = points
    .map((point, pointIndex) => {
      let nearestDistance2 = Infinity;
      for (let otherIndex = 0; otherIndex < points.length; otherIndex += 1) {
        if (otherIndex === pointIndex) continue;
        const other = points[otherIndex];
        const dx = other.lon - point.lon;
        const dy = other.lat - point.lat;
        const distance2 = dx * dx + dy * dy;
        if (distance2 < nearestDistance2) {
          nearestDistance2 = distance2;
        }
      }
      return Number.isFinite(nearestDistance2) && nearestDistance2 > epsilon
        ? Math.sqrt(nearestDistance2)
        : null;
    })
    .filter(
      (distance): distance is number =>
        distance !== null && Number.isFinite(distance),
    );

  const alphaScale =
    quantile(nearestNeighborDistances, 0.92) ??
    quantile(
      interiorTriangles.map((triangle) => Math.sqrt(triangle.circumradius2)),
      0.75,
    ) ??
    null;

  const buildLoopsForRadius = (maxRadius: number) => {
    const maxRadius2 =
      Number.isFinite(maxRadius) && maxRadius > 0
        ? maxRadius * maxRadius
        : Infinity;
    const boundaryEdges = new Map<string, [number, number]>();

    interiorTriangles.forEach((triangle) => {
      if (triangle.circumradius2 > maxRadius2 + epsilon) return;
      [
        [triangle.a, triangle.b],
        [triangle.b, triangle.c],
        [triangle.c, triangle.a],
      ].forEach(([start, end]) => {
        const key = normalizeEdgeKey(start, end);
        if (boundaryEdges.has(key)) {
          boundaryEdges.delete(key);
        } else {
          boundaryEdges.set(key, [start, end]);
        }
      });
    });

    if (boundaryEdges.size === 0) return [];

    const adjacency = new Map<number, number[]>();
    const pushNeighbor = (from: number, to: number) => {
      const neighbors = adjacency.get(from) ?? [];
      if (!neighbors.includes(to)) neighbors.push(to);
      adjacency.set(from, neighbors);
    };
    boundaryEdges.forEach(([start, end]) => {
      pushNeighbor(start, end);
      pushNeighbor(end, start);
    });

    const visitedEdgeKeys = new Set<string>();
    const loops: LatLng[][] = [];
    const boundaryEdgeList = Array.from(boundaryEdges.values());

    const toLatLngLoop = (pointIndexes: number[]) => {
      const loop = pointIndexes.map((index): LatLng => {
        const point = triangulationPoints[index];
        return [point.lat, point.lon];
      });
      return Math.abs(getPolygonArea(loop)) > epsilon ? loop : null;
    };

    boundaryEdgeList.forEach(([start, next]) => {
      const startingEdgeKey = normalizeEdgeKey(start, next);
      if (visitedEdgeKeys.has(startingEdgeKey)) return;

      const pointIndexes = [start];
      let previous = start;
      let current = next;
      let guard = 0;

      while (guard < boundaryEdgeList.length + 4) {
        visitedEdgeKeys.add(normalizeEdgeKey(previous, current));
        pointIndexes.push(current);
        const neighbors = adjacency.get(current) ?? [];
        if (neighbors.length === 0) break;

        if (current === start) {
          pointIndexes.pop();
          const loop = toLatLngLoop(pointIndexes);
          if (loop) loops.push(loop);
          break;
        }

        const candidateNeighbors = neighbors.filter(
          (candidate) => candidate !== previous,
        );
        let nextPoint =
          candidateNeighbors.find((candidate) => {
            return !visitedEdgeKeys.has(normalizeEdgeKey(current, candidate));
          }) ?? null;
        if (nextPoint == null && candidateNeighbors.length > 0) {
          nextPoint = candidateNeighbors[0];
        }
        if (nextPoint == null) break;

        previous = current;
        current = nextPoint;
        guard += 1;
      }
    });

    return loops.slice().sort((left, right) => {
      return Math.abs(getPolygonArea(right)) - Math.abs(getPolygonArea(left));
    });
  };

  const radiusCandidates =
    alphaScale !== null && Number.isFinite(alphaScale) && alphaScale > 0
      ? [alphaScale * 2.1, alphaScale * 3.0, alphaScale * 4.2, Infinity]
      : [Infinity];

  for (const radius of radiusCandidates) {
    const loops = buildLoopsForRadius(radius);
    if (loops.length > 0) return loops;
  }

  const hull = computeConvexHull(latlngs);
  return hull ? [hull] : [];
};
