import { useMemo } from 'react';
import useSWR from 'swr/immutable';
import { getJSON } from '../lib/helper';

import { useAppContext } from '../lib/store';
import type { DirectionsResponse, Location, CarResult, Route, GeoJson } from '../lib/types';
import { useFuelAlongRoute } from './useFuelAlongRoute';

const DIRECT_ROUTE_THRESHOLD_KM = 0.5;

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

  const shortestFuel = useFuelAlongRoute(getRouteCoordinates(initialShortestRoute), input.fuelType);

  const rerouteWaypoint = shortestFuel.data?.cheapest;
  const shouldRerouteShortest =
    Boolean(initialShortestRoute) &&
    Boolean(rerouteWaypoint) &&
    (rerouteWaypoint?.distanceToRoute ?? 0) > DIRECT_ROUTE_THRESHOLD_KM;

  const reroutedDirections = useSWR<DirectionsResponse>(
    () =>
      shouldRerouteShortest && start?.latitude && end?.latitude
        ? [
            '/api/directions',
            {
              'lng-start': start.longitude,
              'lat-start': start.latitude,
              'lng-dest': end.longitude,
              'lat-dest': end.latitude,
              'wp-lng-0': rerouteWaypoint?.station.lng,
              'wp-lat-0': rerouteWaypoint?.station.lat,
            },
          ]
        : null,
    getJSON
  );

  const { shortestRoute: reroutedShortestRoute } = useMemo(
    () => getFastestAndShortest(reroutedDirections.data),
    [reroutedDirections.data]
  );

  const shortestRoute = reroutedShortestRoute ?? initialShortestRoute;
  const reroutedShortestCoordinates = getRouteCoordinates(reroutedShortestRoute);
  const fastestCoordinates = getRouteCoordinates(fastestRoute);

  const reroutedShortestAlongRoute = useFuelAlongRoute(reroutedShortestCoordinates, input.fuelType);
  const fastestAlongRoute = useFuelAlongRoute(fastestCoordinates, input.fuelType);
  const shortestAlongRoute = reroutedShortestRoute ? reroutedShortestAlongRoute : shortestFuel;

  const fastest = useMemo(() => toCarResult(fastestRoute), [fastestRoute]);

  const shortest = useMemo(() => {
    const result = toCarResult(shortestRoute);
    if (!result) {
      return undefined;
    }

    result.station = shortestAlongRoute.data?.cheapest ?? undefined;
    return result;
  }, [shortestRoute, shortestAlongRoute.data?.cheapest]);

  const fastestOnRouteStations = useMemo(
    () =>
      (fastestAlongRoute.data?.stations ?? []).filter(
        (station) => station.distanceToRoute <= DIRECT_ROUTE_THRESHOLD_KM
      ),
    [fastestAlongRoute.data?.stations]
  );

  const isLoading =
    swr.isLoading ||
    reroutedDirections.isLoading ||
    reroutedShortestAlongRoute.isLoading ||
    shortestAlongRoute.isLoading ||
    fastestAlongRoute.isLoading;

  return {
    ...swr,
    isLoading,
    fastest,
    shortest,
    cheapestStation: shortestAlongRoute.data?.cheapest ?? null,
    fastestOnRouteStations,
  };
};
