import { FeatureCollection } from 'geojson';
import {
  Location as HafasLocation,
  Station as HafasStation,
  Stop as HafasStop,
  Journey as HafasJourney,
} from 'hafas-client';
import { useEffect, useState } from 'react';
import useSWR from 'swr/immutable';
import { getJSON } from '../lib/helper';
import { useAppContext } from '../lib/store';
import type { HafasResult, Location } from '../lib/types';

const getCoords = (stop: HafasLocation | HafasStation | HafasStop | undefined): [number, number] | null => {
  if (!stop) return null;
  if (stop.type === 'location' && stop.longitude && stop.latitude) {
    return [stop.longitude, stop.latitude];
  }
  const loc = (stop as HafasStation | HafasStop).location;
  if (loc?.longitude && loc?.latitude) {
    return [loc.longitude, loc.latitude];
  }
  return null;
};

const getGeoJson = (journey: HafasJourney): FeatureCollection | undefined => {
  // Try polyline data first
  const polylineFeatures = journey.legs.flatMap((leg) => leg?.polyline?.features ?? []);
  const polylineCoords = polylineFeatures.map((feature) => feature.geometry.coordinates);

  // Fall back to leg origin/destination coordinates
  const coordinates = polylineCoords.length > 0
    ? polylineCoords
    : journey.legs
        .flatMap((leg) => [getCoords(leg.origin), getCoords(leg.destination)])
        .filter((c): c is [number, number] => c !== null);

  if (coordinates.length < 2) return undefined;

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    ],
  };
};

export const useHafas = (start: Location | undefined, end: Location | undefined) => {
  const [result, setResult] = useState<HafasResult>();

  const input = useAppContext((state) => state.input);

  const swrStartLocation = useSWR<HafasLocation | HafasStation | HafasStop>(
    () =>
      start?.latitude && start?.latitude
        ? [
          '/api/db/stations',
          {
            longitude: start?.longitude,
            latitude: start?.latitude,
          },
        ]
        : null,
    getJSON
  );

  const swrEndLocation = useSWR<HafasLocation | HafasStation | HafasStop>(
    () =>
      end?.latitude && end?.latitude
        ? [
          '/api/db/stations',
          {
            longitude: end?.longitude,
            latitude: end?.latitude,
          },
        ]
        : null,
    getJSON
  );

  const swrAdults = useSWR<HafasJourney[]>(
    () =>
      input.adults && swrStartLocation?.data?.id && swrEndLocation?.data?.id
        ? [
          '/api/db/journey',
          {
            from: swrStartLocation?.data?.id,
            to: swrEndLocation?.data?.id,
            age: 18,
          },
        ]
        : null,
    getJSON
  );

  const swrChildren = useSWR<HafasJourney[]>(
    () =>
      input.children && swrStartLocation?.data?.id && swrEndLocation?.data?.id
        ? [
          '/api/db/journey',
          {
            from: swrStartLocation?.data?.id,
            to: swrEndLocation?.data?.id,
            age: 12,
          },
        ]
        : null,
    getJSON
  );

  useEffect(() => {
    const priceAdults = swrAdults?.data?.[0]?.price;
    const priceChildren = swrChildren?.data?.[0]?.price;

    if (!priceAdults && !priceChildren) {
      setResult({
        duration: 0,
        changes: 0,
        price: 0,
      });
      return;
    }

    const journey = swrAdults?.data?.[0] || swrChildren?.data?.[0];

    const price =
      (priceAdults?.amount ?? 0) * (input.adults || 0) + (priceChildren?.amount ?? 0) * (input.children || 0);

    const plannedDeparture = new Date(journey?.legs?.[0]?.plannedDeparture);
    const plannedArrival = new Date(journey?.legs?.[(journey?.legs?.length ?? 1) - 1]?.plannedArrival);
    const duration = (+plannedArrival - +plannedDeparture) / (1000 * 60);
    const changes = journey?.legs?.filter(leg => !leg.walking).length - 1;

    setResult({
      duration,
      changes,
      price: price * (input.twoWay ? 2 : 1),
      geojson: getGeoJson(journey),
    });
  }, [swrAdults.data, swrChildren.data, input.twoWay, input.adults, input.children]);

  return {
    ...swrAdults,
    result,
  };
};
