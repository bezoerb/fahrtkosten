import { useEffect, useState } from 'react';
import useSWR from 'swr/immutable';
import { getJSON } from '../lib/helper';
import { FuelType, Location, TankerkoenigResponse } from '../lib/types';

export const useTankerkoenig = (location: Location | undefined, fuelType: FuelType) => {
  const [price, setPrice] = useState(0);

  const swr = useSWR<TankerkoenigResponse>(() => {
    if (location?.latitude && location?.longitude) {
      return ['/api/fuel', { lat: location?.latitude, lng: location?.longitude }];
    }

    return null;
  }, getJSON);

  useEffect(() => {
    const prices = (swr.data?.stations || [])
      .map((station) => station[fuelType])
      .filter((v) => v)
      .slice(0, 5);

    setPrice(Math.min(...prices));
  }, [swr.data, fuelType]);

  return {
    ...swr,
    price
  };
};
