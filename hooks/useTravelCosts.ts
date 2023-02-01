import { useState, useEffect } from 'react';
import useSWR from 'swr/immutable';
import { useImmer } from 'use-immer';
import { getJSON } from '../lib/helper';

import { useAppContext } from '../lib/store';
import { CarResult, HvvResult } from '../lib/types';
import { useDirections } from './useDirections';
import { useGeocode } from './useGeocode';
import { useHvv } from './useHvv';
import { useTankerkoenig } from './useTankerkoenig';

type Params = {
  start?: string;
  dest?: string;
  fuelType?: string;
  oneWay?: boolean;
  fuelConsumption?: number;
};

type Result = {
  carShortest: CarResult;
  carFastest: CarResult;
  hvv: HvvResult;
  fuelPrice: number;
  start: string;
  dest: string;
  ready: boolean;
};

export const useTravelCosts = () => {
  const input = useAppContext((state) => state.input);

  const [result, setResult] = useImmer<Result>({} as Result);

  const { data: locationStart } = useGeocode('start');

  const { data: locationDest } = useGeocode('dest');

  const { price: fuelPrice } = useTankerkoenig(locationStart, input.fuelType);

  const { fastest, shortest } = useDirections(locationStart, locationDest);
  const { result: hvvResult } = useHvv(locationStart, locationDest);

  useEffect(() => {
    setResult((draft) => {
      if (draft.start !== locationStart?.name ?? '') {
        draft.start = locationStart?.name ?? '';
      }
      if (draft.dest !== locationDest?.name ?? '') {
        draft.dest = locationDest?.name ?? '';
      }

      if (JSON.stringify(draft.hvv) !== JSON.stringify(hvvResult)) {
        draft.hvv = hvvResult;
      }

      if (draft.fuelPrice !== fuelPrice) {
        draft.fuelPrice = fuelPrice;
      }

      if (JSON.stringify(draft.carShortest) !== JSON.stringify(shortest)) {
        draft.carShortest = shortest;
      }

      if (JSON.stringify(draft.carFastest) !== JSON.stringify(fastest)) {
        draft.carFastest = fastest;
      }

      const ready = fastest && fastest?.duration !== Infinity

      if (draft.ready !== ready) {
        draft.ready = ready;
      }
    });
  }, [locationStart, locationDest, fastest, shortest, setResult, hvvResult, fuelPrice]);

  return result;
};
