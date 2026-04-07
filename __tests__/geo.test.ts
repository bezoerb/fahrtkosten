import {
  haversineDistance,
  pointToRouteDistance,
  routeLengthKm,
  sampleRoutePoints,
} from '../lib/geo';

describe('geo helpers', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance([10, 53], [10, 53])).toBe(0);
  });

  it('calculates plausible haversine distance', () => {
    // Berlin -> Hamburg ~255km
    const distance = haversineDistance([13.405, 52.52], [9.9937, 53.5511]);
    expect(distance).toBeGreaterThan(250);
    expect(distance).toBeLessThan(260);
  });

  it('calculates route length in km', () => {
    // 1 degree latitude ~111km
    const length = routeLengthKm([
      [9, 53],
      [9, 54],
    ]);
    expect(length).toBeGreaterThan(110);
    expect(length).toBeLessThan(112);
  });

  it('samples route points including start and end', () => {
    const points = sampleRoutePoints(
      [
        [9, 53],
        [9, 55],
      ],
      50
    );

    expect(points[0]).toEqual([9, 53]);
    expect(points[points.length - 1]).toEqual([9, 55]);
    expect(points.length).toBeGreaterThan(3);
  });

  it('computes near-zero distance for point on the route', () => {
    const distance = pointToRouteDistance([1, 0], [
      [0, 0],
      [2, 0],
    ]);
    expect(distance).toBeLessThan(0.001);
  });

  it('computes positive distance for point away from route', () => {
    const distance = pointToRouteDistance([1, 1], [
      [0, 0],
      [2, 0],
    ]);
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(112);
  });
});
