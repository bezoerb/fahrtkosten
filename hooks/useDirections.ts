import { useMemo } from 'react';
import useSWR from 'swr/immutable';
import { getJSON } from '../lib/helper';

import { useAppContext } from '../lib/store';
import { haversineDistance, routeLengthKm } from '../lib/geo';
import type { AlongRouteStation, DirectionsResponse, Location, CarResult, Route, GeoJson } from '../lib/types';
import { useFuelAlongRoute } from './useFuelAlongRoute';

const DIRECT_ROUTE_THRESHOLD_KM = 0.5;
const REFUEL_INTERVAL_KM = 300;

/**
 * Pick the cheapest on-route station per ~REFUEL_INTERVAL_KM segment.
 * Always includes a station near the start of the route.
 */
const cheapestPerSegment = (
  stations: AlongRouteStation[],
  routeCoordinates: [number, number][] | undefined,
): AlongRouteStation[] => {
  const onRoute = stations.filter(
    (s) => s.distanceToRoute <= DIRECT_ROUTE_THRESHOLD_KM
  );
  if (!onRoute.length) return [];

  const totalKm = routeCoordinates ? routeLengthKm(routeCoordinates) : 0;
  // Always at least 1 segment; add one per REFUEL_INTERVAL_KM after that
  const segments = Math.max(1, 1 + Math.ceil(Math.max(0, totalKm - REFUEL_INTERVAL_KM) / REFUEL_INTERVAL_KM));

  if (segments <= 1) {
    return onRoute[0] ? [onRoute[0]] : [];
  }

  // Assign each station to a segment based on its position along the route
  const segmentSize = totalKm / segments;
  const buckets: (AlongRouteStation | null)[] = Array.from({ length: segments }, () => null);

  for (const station of onRoute) {
    const stationCoord: [number, number] = [station.station.lng, station.station.lat];
    let minDistAlongRoute = 0;
    let accumulated = 0;
    let bestProjectionDist = Infinity;

    if (routeCoordinates && routeCoordinates.length >= 2) {
      for (let i = 1; i < routeCoordinates.length; i++) {
        const segDist = haversineDistance(routeCoordinates[i - 1], routeCoordinates[i]);
        const distToSegStart = haversineDistance(stationCoord, routeCoordinates[i - 1]);
        const distToSegEnd = haversineDistance(stationCoord, routeCoordinates[i]);
        const minDist = Math.min(distToSegStart, distToSegEnd);
        if (minDist < bestProjectionDist) {
          bestProjectionDist = minDist;
          minDistAlongRoute = accumulated + (distToSegStart < distToSegEnd ? 0 : segDist);
        }
        accumulated += segDist;
      }
    }

    const segmentIndex = Math.min(segments - 1, Math.floor(minDistAlongRoute / segmentSize));
    const current = buckets[segmentIndex];
    if (!current || station.effectivePrice < current.effectivePrice) {
      buckets[segmentIndex] = station;
    }
  }

  return buckets.filter((s): s is AlongRouteStation => s !== null);
};

const getGeojson = (route: Route): GeoJson => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: route.geometry,
    },
  ],
});

const getFastestAndShortest = (response: DirectionsResponse | undefined) => {
  const routes = response?.routes ?? [];

  const fastestRoute = [...routes].sort((a, b) => a.duration - b.duration)[0];
  const shortestRoute = [...routes].sort((a, b) => a.distance - b.distance)[0];

  return { fastestRoute, shortestRoute };
};

const getRouteCoordinates = (route: Route | undefined): [number, number][] | undefined => {
  const geometry = route?.geometry;
  if (!geometry || geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates)) {
    return undefined;
  }

  return geometry.coordinates as [number, number][];
};

const toCarResult = (route: Route | undefined): CarResult | undefined => {
  if (!route) {
    return undefined;
  }

  return {
    distance: route.distance / 1000,
    duration: route.duration / 60,
    price: 0,
    geojson: getGeojson(route),
  };
};

const MAX_REROUTE_CANDIDATES = 3;
const MAX_DETOUR_KM = 5;

export const useDirections = (start: Location | undefined, end: Location | undefined) => {
  const input = useAppContext((state) => state.input);

  const swr = useSWR<DirectionsResponse>(
    () =>
      start?.latitude && end?.latitude
        ? [
            '/api/directions',
            {
              'lng-start': start?.longitude,
              'lat-start': start?.latitude,
              'lng-dest': end?.longitude,
              'lat-dest': end?.latitude,
            },
          ]
        : null,
    getJSON
  );

  const { fastestRoute, shortestRoute: initialShortestRoute } = useMemo(
    () => getFastestAndShortest(swr.data),
    [swr.data]
  );

  const initialShortestDistanceKm = initialShortestRoute ? initialShortestRoute.distance / 1000 : 0;

  const shortestFuel = useFuelAlongRoute(getRouteCoordinates(initialShortestRoute), input.fuelType);

  // Pick top N candidates for rerouting
  const rerouteCandidates = useMemo(() => {
    const stations = shortestFuel.data?.stations ?? [];
    return stations.slice(0, MAX_REROUTE_CANDIDATES);
  }, [shortestFuel.data?.stations]);

  const canReroute = Boolean(initialShortestRoute) && Boolean(start?.latitude) && Boolean(end?.latitude);

  // Reroute through each candidate in parallel
  const reroute0 = useSWR<DirectionsResponse>(
    () =>
      canReroute && rerouteCandidates[0]
        ? [
            '/api/directions',
            {
              'lng-start': start!.longitude,
              'lat-start': start!.latitude,
              'lng-dest': end!.longitude,
              'lat-dest': end!.latitude,
              'wp-lng-0': rerouteCandidates[0].station.lng,
              'wp-lat-0': rerouteCandidates[0].station.lat,
            },
          ]
        : null,
    getJSON
  );

  const reroute1 = useSWR<DirectionsResponse>(
    () =>
      canReroute && rerouteCandidates[1]
        ? [
            '/api/directions',
            {
              'lng-start': start!.longitude,
              'lat-start': start!.latitude,
              'lng-dest': end!.longitude,
              'lat-dest': end!.latitude,
              'wp-lng-0': rerouteCandidates[1].station.lng,
              'wp-lat-0': rerouteCandidates[1].station.lat,
            },
          ]
        : null,
    getJSON
  );

  const reroute2 = useSWR<DirectionsResponse>(
    () =>
      canReroute && rerouteCandidates[2]
        ? [
            '/api/directions',
            {
              'lng-start': start!.longitude,
              'lat-start': start!.latitude,
              'lng-dest': end!.longitude,
              'lat-dest': end!.latitude,
              'wp-lng-0': rerouteCandidates[2].station.lng,
              'wp-lat-0': rerouteCandidates[2].station.lat,
            },
          ]
        : null,
    getJSON
  );

  // Pick the best candidate: acceptable detour + cheapest effective price
  const { bestReroutedRoute, bestStation } = useMemo(() => {
    const attempts = [
      { data: reroute0.data, candidate: rerouteCandidates[0] },
      { data: reroute1.data, candidate: rerouteCandidates[1] },
      { data: reroute2.data, candidate: rerouteCandidates[2] },
    ];

    let bestRoute: Route | undefined;
    let bestStn: AlongRouteStation | undefined;
    let bestEffective = Infinity;

    for (const { data, candidate } of attempts) {
      if (!data || !candidate) continue;
      const { shortestRoute: candidateRoute } = getFastestAndShortest(data);
      if (!candidateRoute) continue;

      const detourKm = candidateRoute.distance / 1000 - initialShortestDistanceKm;
      if (detourKm > MAX_DETOUR_KM) continue;

      // Effective price accounting for actual detour fuel cost
      const effective = candidate.station.price + detourKm * 0.15;
      if (effective < bestEffective) {
        bestEffective = effective;
        bestRoute = candidateRoute;
        bestStn = candidate;
      }
    }

    return { bestReroutedRoute: bestRoute, bestStation: bestStn };
  }, [reroute0.data, reroute1.data, reroute2.data, rerouteCandidates, initialShortestDistanceKm]);

  const shortestRoute = bestReroutedRoute ?? initialShortestRoute;
  const reroutedShortestCoordinates = bestReroutedRoute ? getRouteCoordinates(bestReroutedRoute) : undefined;
  const fastestCoordinates = getRouteCoordinates(fastestRoute);

  const reroutedShortestAlongRoute = useFuelAlongRoute(reroutedShortestCoordinates, input.fuelType);
  const shortestAlongRoute = bestReroutedRoute ? reroutedShortestAlongRoute : shortestFuel;
  const fastestAlongRoute = useFuelAlongRoute(fastestCoordinates, input.fuelType);

  const fastest = useMemo(() => toCarResult(fastestRoute), [fastestRoute]);

  const shortest = useMemo(() => {
    const result = toCarResult(shortestRoute);
    if (!result) {
      return undefined;
    }

    result.station = bestStation ?? shortestAlongRoute.data?.cheapest ?? undefined;
    return result;
  }, [shortestRoute, bestStation, shortestAlongRoute.data?.cheapest]);

  const fastestOnRouteStations = useMemo(
    () => cheapestPerSegment(
      fastestAlongRoute.data?.stations ?? [],
      fastestCoordinates,
    ),
    [fastestAlongRoute.data?.stations, fastestCoordinates]
  );

  const averageFuelPrice = useMemo(() => {
    const cheapestStationPrice = (bestStation ?? shortestAlongRoute.data?.cheapest)?.station.price;
    const fastestPrices = fastestOnRouteStations.map((s) => s.station.price);
    const allPrices = [
      ...(cheapestStationPrice ? [cheapestStationPrice] : []),
      ...fastestPrices,
    ];
    if (!allPrices.length) return null;
    return allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;
  }, [bestStation, shortestAlongRoute.data?.cheapest, fastestOnRouteStations]);

  const isLoading =
    swr.isLoading ||
    reroute0.isLoading ||
    reroute1.isLoading ||
    reroute2.isLoading ||
    reroutedShortestAlongRoute.isLoading ||
    shortestAlongRoute.isLoading ||
    fastestAlongRoute.isLoading;

  return {
    ...swr,
    isLoading,
    fastest,
    shortest,
    cheapestStation: bestStation ?? shortestAlongRoute.data?.cheapest ?? null,
    fastestOnRouteStations,
    averageFuelPrice,
  };
};
