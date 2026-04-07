import { useState, useEffect } from 'react';
import useSWR from 'swr/immutable';
import { useImmer } from 'use-immer';
import { getJSON } from '../lib/helper';

import { useAppContext } from '../lib/store';
import { AlongRouteStation, CarResult, HafasResult, HvvResult, Position } from '../lib/types';
import { useDirections } from './useDirections';
import { useGeocode } from './useGeocode';
import { useDeutscheBahn } from './useDeutscheBahn';
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
  carShortest?: CarResult;
  carFastest?: CarResult;
  hvv?: HvvResult;
  db?: HafasResult;
  fuelPrice?: number;
  start?: Position;
  dest?: Position;
  fastestOnRouteStations?: AlongRouteStation[];
  ready?: boolean;
};

const calculatePrice = (
  distanceInKm: number | undefined,
  fuelPrice: number,
  fuelConsumption: number,
  twoWay: boolean
) => {
  if (
    !distanceInKm ||
    !fuelPrice ||
    !fuelConsumption ||
    !Number.isFinite(distanceInKm) ||
    !Number.isFinite(fuelPrice) ||
    !Number.isFinite(fuelConsumption)
  ) {
    return 0;
  }

  return (distanceInKm / 100) * fuelPrice * fuelConsumption * (twoWay ? 2 : 1);
};

export const useTravelCosts = () => {
  const input = useAppContext((state) => state.input);

  const [result, setResult] = useImmer<Result>({} as Result);

  const { data: locationStart } = useGeocode('start');

  const { data: locationDest } = useGeocode('dest');

  const { price: fuelPrice } = useTankerkoenig(locationStart, input.fuelType);

  const { fastest, shortest, cheapestStation, fastestOnRouteStations } = useDirections(locationStart, locationDest);
  const { result: hvvResult } = useHvv(locationStart, locationDest);

  const { result: hafasResult } = useDeutscheBahn(locationStart, locationDest);
  const effectiveFuelPrice = cheapestStation?.station.price ?? fuelPrice;

  const carFastest = fastest
    ? {
        ...fastest,
        price: calculatePrice(fastest.distance, effectiveFuelPrice, input.fuelConsumption, input.twoWay),
      }
    : undefined;

  const carShortest = shortest
    ? {
        ...shortest,
        price: calculatePrice(shortest.distance, effectiveFuelPrice, input.fuelConsumption, input.twoWay),
        station: cheapestStation ?? shortest.station,
      }
    : undefined;

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

      if (draft.fuelPrice !== effectiveFuelPrice) {
        draft.fuelPrice = effectiveFuelPrice;
      }

      if (JSON.stringify(draft.carShortest) !== JSON.stringify(carShortest)) {
        draft.carShortest = carShortest;
      }

      if (JSON.stringify(draft.carFastest) !== JSON.stringify(carFastest)) {
        draft.carFastest = carFastest;
      }

      if (JSON.stringify(draft.fastestOnRouteStations) !== JSON.stringify(fastestOnRouteStations)) {
        draft.fastestOnRouteStations = fastestOnRouteStations;
      }

      if (JSON.stringify(draft.db) !== JSON.stringify(hafasResult)) {
        // @ts-ignore
        draft.db = hafasResult;
      }

      const ready = carFastest && carFastest?.duration !== Infinity;

      if (draft.ready !== ready) {
        draft.ready = ready;
      }
    });
  }, [
    locationStart,
    locationDest,
    carFastest,
    carShortest,
    setResult,
    hvvResult,
    effectiveFuelPrice,
    fastestOnRouteStations,
    hafasResult,
  ]);

  return result;
};
