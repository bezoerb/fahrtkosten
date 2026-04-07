import useSWR from 'swr/immutable';

import { postJSON } from '../lib/helper';
import { AlongRouteResponse, FuelType } from '../lib/types';

type Coordinate = [number, number];
type SupportedFuelType = FuelType.E5 | FuelType.E10 | FuelType.Diesel;

const isSupportedFuelType = (fuelType: FuelType): fuelType is SupportedFuelType =>
  fuelType === FuelType.E5 || fuelType === FuelType.E10 || fuelType === FuelType.Diesel;

export const useFuelAlongRoute = (coordinates: Coordinate[] | undefined, fuelType: FuelType) => {
  const shouldFetch = Boolean(coordinates?.length && isSupportedFuelType(fuelType));

  return useSWR<AlongRouteResponse>(
    () =>
      shouldFetch
        ? [
            '/api/fuel/along-route',
            {
              coordinates,
              fuelType,
            },
          ]
        : null,
    postJSON
  );
};
