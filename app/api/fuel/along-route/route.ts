import { NextRequest, NextResponse } from 'next/server';

import { Coordinate, pointToRouteDistance, routeLengthKm, sampleRoutePoints } from '../../../../lib/geo';
import { FuelType, TankerkoenigResponse } from '../../../../lib/types';
import { MAX_DISTANCE_KM, MAX_SAMPLES, MIN_INTERVAL_KM, scoreStations } from './scoring';

const SAMPLE_RADIUS_KM = 10;
const MAX_COORDINATES = 10000;

type Body = {
  coordinates?: unknown;
  fuelType?: unknown;
};

const isCoordinate = (value: unknown): value is Coordinate =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === 'number' &&
  Number.isFinite(value[0]) &&
  typeof value[1] === 'number' &&
  Number.isFinite(value[1]);

const isFuelType = (fuelType: unknown): fuelType is FuelType.E5 | FuelType.E10 | FuelType.Diesel =>
  fuelType === FuelType.E5 || fuelType === FuelType.E10 || fuelType === FuelType.Diesel;

const fetchStationsForSample = async (sample: Coordinate, fuelType: FuelType.E5 | FuelType.E10 | FuelType.Diesel) => {
  const [lng, lat] = sample;
  const url = new URL('https://creativecommons.tankerkoenig.de/json/list.php');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lng', String(lng));
  url.searchParams.set('apikey', process.env.TANKER_KOENIG_KEY!);
  url.searchParams.set('rad', String(SAMPLE_RADIUS_KM));
  url.searchParams.set('sort', 'dist');
  url.searchParams.set('type', fuelType);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as TankerkoenigResponse;
  return data.stations ?? [];
};

export async function POST(request: NextRequest) {
  if (!process.env.TANKER_KOENIG_KEY) {
    return NextResponse.json({ error: 'Missing tankerkoenig api key' }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const coordinatesInput = body.coordinates;
  const fuelTypeInput = body.fuelType;

  if (!isFuelType(fuelTypeInput)) {
    return NextResponse.json({ error: 'Invalid fuelType' }, { status: 422 });
  }

  if (!Array.isArray(coordinatesInput) || coordinatesInput.length < 2) {
    return NextResponse.json({ error: 'At least 2 coordinates are required' }, { status: 422 });
  }

  if (coordinatesInput.length > MAX_COORDINATES) {
    return NextResponse.json({ error: 'Too many coordinates' }, { status: 422 });
  }

  if (!coordinatesInput.every(isCoordinate)) {
    return NextResponse.json({ error: 'Invalid coordinates format' }, { status: 422 });
  }

  const coordinates = coordinatesInput as Coordinate[];
  const routeLength = routeLengthKm(coordinates);
  const intervalKm = Math.max(routeLength / MAX_SAMPLES, MIN_INTERVAL_KM);
  const sampledPoints = sampleRoutePoints(coordinates, intervalKm);

  const stationLists = await Promise.allSettled(
    sampledPoints.map((sample) => fetchStationsForSample(sample, fuelTypeInput))
  );

  const stationById = new Map<
    string,
    {
      station: {
        id: string;
        name: string;
        brand: string;
        price: number;
        lat: number;
        lng: number;
      };
      distanceToRoute: number;
    }
  >();

  for (const listResult of stationLists) {
    if (listResult.status !== 'fulfilled') {
      continue;
    }

    for (const station of listResult.value) {
      const stationPrice = station[fuelTypeInput];
      if (typeof stationPrice !== 'number' || !Number.isFinite(stationPrice)) {
        continue;
      }

      const stationId = station.id;
      const distanceToRoute = pointToRouteDistance([station.lng, station.lat], coordinates);
      if (distanceToRoute > MAX_DISTANCE_KM) {
        continue;
      }

      const existing = stationById.get(stationId);
      if (!existing || stationPrice < existing.station.price) {
        stationById.set(stationId, {
          station: {
            id: station.id,
            name: station.name,
            brand: station.brand,
            price: stationPrice,
            lat: station.lat,
            lng: station.lng,
          },
          distanceToRoute,
        });
      }
    }
  }

  const stations = scoreStations([...stationById.values()]);
  return NextResponse.json({
    stations,
    cheapest: stations[0] ?? null,
  });
}
