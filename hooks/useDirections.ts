import { useState, useEffect } from 'react';
import useSWR from 'swr/immutable';
import { useImmer } from 'use-immer';
import { getJSON } from '../lib/helper';

import { useAppContext } from '../lib/store';
import type { DirectionsResponse, Location, CarResult, Route, GeoJson } from '../lib/types';
import { useTankerkoenig } from './useTankerkoenig';

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

export const useDirections = (start: Location | undefined, end: Location | undefined) => {
  const input = useAppContext((state) => state.input);
  const { price } = useTankerkoenig(start, input.fuelType);

  const [fastest, setFastest] = useState<CarResult>();
  const [shortest, setShortest] = useState<CarResult>();

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

  const calculatePrice = (distance: number, fuelPrice: number, fuelConsumption: number, oneWay: boolean) => {
    return (distance / 100000) * fuelPrice * fuelConsumption * (oneWay ? 1 : 2);
  };

  useEffect(() => {
    const [fastestRoute] = (swr.data?.routes ?? []).sort((a, b) => a.duration - b.duration);
    const [shortestRoute] = (swr.data?.routes ?? []).sort((a, b) => a.distance - b.distance);

    if (fastestRoute) {
      setFastest({
        distance: fastestRoute.distance / 1000,
        duration: fastestRoute.duration / 60,
        price: calculatePrice(fastestRoute.distance, price, input.fuelConsumption, input.oneWay),
        geojson: getGeojson(fastestRoute),
      });
    }
    if (shortestRoute) {
      setShortest({
        distance: shortestRoute.distance / 1000,
        duration: shortestRoute.duration / 60,
        price: calculatePrice(shortestRoute.distance, price, input.fuelConsumption, input.oneWay),
        geojson: getGeojson(shortestRoute),
      });
    }
  }, [input.fuelConsumption, input.oneWay, price, swr.data]);

  return {
    ...swr,
    fastest,
    shortest,
  };
};
