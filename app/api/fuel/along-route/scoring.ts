import type { AlongRouteStation } from '../../../../lib/types';

export type StationCandidate = {
  station: AlongRouteStation['station'];
  distanceToRoute: number;
};

export const MAX_SAMPLES = 4;
export const MIN_INTERVAL_KM = 30;
export const MAX_DISTANCE_KM = 5;
export const DIRECT_THRESHOLD_KM = 0.5;
export const FUEL_COST_PER_KM = 0.15;

const round3 = (value: number) => Math.round(value * 1000) / 1000;

export const scoreStation = (
  candidate: StationCandidate,
  directThresholdKm: number = DIRECT_THRESHOLD_KM,
  fuelCostPerKm: number = FUEL_COST_PER_KM
): AlongRouteStation => {
  const detourKm = candidate.distanceToRoute > directThresholdKm ? candidate.distanceToRoute * 2 : 0;
  const effectivePrice = candidate.station.price + detourKm * fuelCostPerKm;

  return {
    station: candidate.station,
    distanceToRoute: round3(candidate.distanceToRoute),
    detourKm: round3(detourKm),
    effectivePrice: round3(effectivePrice),
  };
};

export const scoreStations = (
  candidates: StationCandidate[],
  directThresholdKm: number = DIRECT_THRESHOLD_KM,
  fuelCostPerKm: number = FUEL_COST_PER_KM
): AlongRouteStation[] =>
  candidates
    .map((candidate) => scoreStation(candidate, directThresholdKm, fuelCostPerKm))
    .sort((a, b) => {
      if (a.effectivePrice !== b.effectivePrice) {
        return a.effectivePrice - b.effectivePrice;
      }

      if (a.distanceToRoute !== b.distanceToRoute) {
        return a.distanceToRoute - b.distanceToRoute;
      }

      return a.station.price - b.station.price;
    });
