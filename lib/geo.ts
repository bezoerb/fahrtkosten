export type Coordinate = [lng: number, lat: number];

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number) => (value * Math.PI) / 180;

export const haversineDistance = (a: Coordinate, b: Coordinate): number => {
  const [lngA, latA] = a;
  const [lngB, latB] = b;

  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const radLatA = toRadians(latA);
  const radLatB = toRadians(latB);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLatA) * Math.cos(radLatB) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const routeLengthKm = (coordinates: Coordinate[]): number => {
  if (coordinates.length < 2) {
    return 0;
  }

  let length = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    length += haversineDistance(coordinates[i - 1], coordinates[i]);
  }

  return length;
};

const interpolate = (start: Coordinate, end: Coordinate, factor: number): Coordinate => {
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  return [startLng + (endLng - startLng) * factor, startLat + (endLat - startLat) * factor];
};

export const sampleRoutePoints = (coordinates: Coordinate[], intervalKm: number): Coordinate[] => {
  if (!coordinates.length) {
    return [];
  }

  if (coordinates.length === 1 || intervalKm <= 0) {
    return [...coordinates];
  }

  const totalLength = routeLengthKm(coordinates);
  if (totalLength === 0) {
    return [coordinates[0]];
  }

  const targets: number[] = [0];
  for (let distance = intervalKm; distance < totalLength; distance += intervalKm) {
    targets.push(distance);
  }
  targets.push(totalLength);

  const sampled: Coordinate[] = [];
  let accumulated = 0;
  let targetIndex = 0;

  for (let i = 1; i < coordinates.length && targetIndex < targets.length; i += 1) {
    const start = coordinates[i - 1];
    const end = coordinates[i];
    const segmentLength = haversineDistance(start, end);

    if (segmentLength === 0) {
      continue;
    }

    while (
      targetIndex < targets.length &&
      targets[targetIndex] <= accumulated + segmentLength + 1e-9
    ) {
      const localDistance = targets[targetIndex] - accumulated;
      const factor = Math.min(1, Math.max(0, localDistance / segmentLength));
      sampled.push(interpolate(start, end, factor));
      targetIndex += 1;
    }

    accumulated += segmentLength;
  }

  const last = coordinates[coordinates.length - 1];
  const sampledLast = sampled[sampled.length - 1];
  if (!sampledLast || sampledLast[0] !== last[0] || sampledLast[1] !== last[1]) {
    sampled.push(last);
  }

  return sampled;
};

const toLocalXY = (coord: Coordinate, originLat: number): [x: number, y: number] => {
  const [lng, lat] = coord;
  const x = toRadians(lng) * EARTH_RADIUS_KM * Math.cos(toRadians(originLat));
  const y = toRadians(lat) * EARTH_RADIUS_KM;
  return [x, y];
};

const pointToSegmentDistanceKm = (p: Coordinate, a: Coordinate, b: Coordinate): number => {
  const [px, py] = toLocalXY(p, p[1]);
  const [ax, ay] = toLocalXY(a, p[1]);
  const [bx, by] = toLocalXY(b, p[1]);

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denominator = abx * abx + aby * aby;

  if (denominator === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / denominator));
  const closestX = ax + abx * t;
  const closestY = ay + aby * t;
  return Math.hypot(px - closestX, py - closestY);
};

export const pointToRouteDistance = (point: Coordinate, routeCoordinates: Coordinate[]): number => {
  if (!routeCoordinates.length) {
    return Infinity;
  }

  if (routeCoordinates.length === 1) {
    return haversineDistance(point, routeCoordinates[0]);
  }

  let minDistance = Infinity;
  for (let i = 1; i < routeCoordinates.length; i += 1) {
    minDistance = Math.min(
      minDistance,
      pointToSegmentDistanceKm(point, routeCoordinates[i - 1], routeCoordinates[i])
    );
  }

  return minDistance;
};
