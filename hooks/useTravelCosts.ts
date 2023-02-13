import { useState, useEffect } from 'react';
import useSWR from 'swr/immutable';
import { useImmer } from 'use-immer';
import { getJSON } from '../lib/helper';
import { Journeys as HafasJourneys } from 'hafas-client';

import { useAppContext } from '../lib/store';
import { CarResult, HafasResult, HvvResult, Position } from '../lib/types';
import { useDirections } from './useDirections';
import { useGeocode } from './useGeocode';
import { useHafas } from './useHafas';
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
  db: HafasResult;
  fuelPrice: number;
  start: Position;
  dest: Position;
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

  const { result: hafasResult } = useHafas(locationStart, locationDest);

  useEffect(() => {
    console.log(hafasResult);
  }, [hafasResult]);

  useEffect(() => {
    setResult((draft) => {
      if (JSON.stringify(draft.start) !== JSON.stringify(locationStart)) {
        draft.start = locationStart;
      }
      if (JSON.stringify(draft.dest) !== JSON.stringify(locationDest)) {
        draft.dest = locationDest;
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

      if (JSON.stringify(draft.db) !== JSON.stringify(hafasResult)) {
        // @ts-ignore
        draft.db = hafasResult;
      }

      const ready = fastest && fastest?.duration !== Infinity;

      if (draft.ready !== ready) {
        draft.ready = ready;
      }
    });
  }, [locationStart, locationDest, fastest, shortest, setResult, hvvResult, fuelPrice, hafasResult]);

  return result;
};
