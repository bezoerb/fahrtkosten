import { useState, useEffect } from 'react';
import useSWR from 'swr/immutable';
import { useImmer } from 'use-immer';

import { useStore } from '../lib/store';
import { useGeocode } from './useGeocode';

type Params = {
  start?: string;
  dest?: string;
  fuelType?: string;
  oneWay?: boolean;
  fuelConsumption?: number;
};

const getUrl = (uri, params) => {
  const url = new URL(uri, 'http://localhost:3000/');
  Object.entries<string>(params).forEach(([key, value]) => url.searchParams.set(key, value));

  return url.toString().replace('http://localhost:3000/', '/');
};

type TicketInfo = {
  basePrice: number;
  notRecommended: boolean;
  regionType: string;
  shopLinkExtraFare: string;
  shopLinkRegular: string;
  tariffGroupID: number;
  tariffGroupLabel: string;
  tariffKindID: number;
  tariffKindLabel: string;
  tariffLevelID: number;
  tariffLevelLabel: string;
};

type CarResult = {
  price: number;
  duration: number;
  distance: number;
};

type HvvResult = {
  price: number;
  duration: number;
  tickets: TicketInfo[];
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

export const get = async (uri, params) => {
  const url = getUrl(uri, params);
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  return fetch(url, options);
};

export const getJSON = async (uri, params) => {
  const response = await get(uri, params);
  return response.json();
};

const getPrice = (ticketInfos: TicketInfo[]) => {
  const price = ticketInfos.reduce((res, info) => res + info?.basePrice ?? 0, 0);
  return Math.round(price * 100) / 100;
};

const calculateTickets = (
  adults: number,
  children: number,
  oneWay: boolean,
  ticketInfos: TicketInfo[]
): TicketInfo[] => {
  const now = new Date();
  const hour = now.getHours();


  // const is9 = (hour >= 1 && hour < 6) || (hour >= 9 && hour < 18);
  const hvvAdultSingle = ticketInfos.find((info) => info.tariffKindID === 1);
  const hvvAdultDay = ticketInfos.find((info) => info.tariffKindID === 21);
  const hvvChildSingle = ticketInfos.find((info) => info.tariffKindID === 2);
  const hvvChildDay = ticketInfos.find((info) => info.tariffKindID === 12);
  const hvvGroup = ticketInfos.find((info) => info.tariffKindID === 23);
  const hvvDay = ticketInfos.find((info) => info.tariffKindID === 11);
  const specialTicket = ticketInfos.find((info) => info.tariffKindID === 49);

  const ticketsAdult = (
    oneWay ? [hvvAdultSingle] : hvvAdultDay ? [hvvAdultDay] : [hvvAdultSingle, hvvAdultSingle]
  ).filter((v) => v);
  const ticketsChild = (
    oneWay ? [hvvChildSingle] : hvvChildDay ? [hvvChildDay] : [hvvChildSingle, hvvChildSingle]
  ).filter((v) => v);

  if (!ticketsAdult.length || !ticketsChild.length) {
    return [];
  }

  const specialTickets = Array.from(Array(Math.max(0, adults + children)))
    .map(() => specialTicket)
    .map((v) => v);

  const specialPrice = getPrice(specialTickets);
  const naivePrice = getPrice(ticketsAdult) * adults + getPrice(ticketsChild) * children;
  let dayPrice = Infinity;
  let dayTickets = [];

  if (adults > 0) {
    dayTickets = [hvvDay, ...calculateTickets(adults - 1, Math.max(0, children - 3), oneWay, ticketInfos)];
    dayPrice = getPrice(dayTickets);
  }

  let groupPrice = Infinity;
  let groupTickets = [];

  if (adults + children > 1 && hvvGroup) {
    const adultsLeft = Math.max(0, adults - 5);
    const placesLeft = Math.max(0, 5 - adults);
    const childrenLeft = Math.max(0, children - placesLeft);

    groupTickets = [hvvGroup, ...calculateTickets(adultsLeft, childrenLeft, oneWay, ticketInfos)];
    groupPrice = getPrice(groupTickets);
  }

  const prices = [
    {
      price: naivePrice,
      tickets: [
        ...Array.from(Array(Math.max(0, adults))).flatMap(() => ticketsAdult),
        ...Array.from(Array(Math.max(0, children))).flatMap(() => ticketsChild),
      ],
    },
    {
      price: dayPrice,
      tickets: dayTickets,
    },
    {
      price: groupPrice,
      tickets: groupTickets,
    },
    {
      price: specialPrice,
      tickets: specialTickets,
    },
  ];

  return prices.reduce(
    (res, data) => {
      if (res.price > data.price) {
        return data;
      }

      return res;
    },
    { price: Infinity, tickets: [] }
  ).tickets;
};

export const useTravelCosts = () => {
  const input = useStore((state) => state.input);

  const [fuelPrice, setFuelPrice] = useState(0);
  const [result, setResult] = useImmer<Result>({} as Result);

  const { data: locationStart } = useGeocode('start');

  const { data: locationDest } = useGeocode('dest');
  const { data: fuelData } = useSWR(
    () => (locationStart ? ['/api/fuel', { lat: locationStart?.latitude, lng: locationStart?.longitude }] : null),
    getJSON
  );

  const { data: directions } = useSWR(
    () =>
      locationStart?.latitude && locationDest?.latitude
        ? [
            '/api/directions',
            {
              'lng-start': locationStart?.longitude,
              'lat-start': locationStart?.latitude,
              'lng-dest': locationDest?.longitude,
              'lat-dest': locationDest?.latitude,
            },
          ]
        : null,
    getJSON
  );

  const { data: hvv } = useSWR(
    () =>
      locationStart?.latitude && locationDest?.latitude
        ? [
            '/api/hvv',
            {
              'lng-start': locationStart?.longitude,
              'lat-start': locationStart?.latitude,
              'lng-dest': locationDest?.longitude,
              'lat-dest': locationDest?.latitude,
            },
          ]
        : null,
    getJSON
  );

  useEffect(() => {
    const carFastest = (directions?.routes ?? []).reduce(
      (res, route) => {
        if (route.duration / 60 < res.duration) {
          return { duration: route.duration / 60, distance: route.distance / 1000 };
        }
        return res;
      },
      { duration: Infinity, distance: Infinity, price: 0 }
    );

    const carShortest = (directions?.routes ?? []).reduce(
      (res, route) => {
        if (route.distance / 1000 < res.distance) {
          return { duration: route.duration / 60, distance: route.distance / 1000 };
        }
        return res;
      },
      { duration: Infinity, distance: Infinity, price: 0 }
    );

    carFastest.price = (carFastest.distance / 100) * fuelPrice * input.fuelConsumption * (input.oneWay ? 1 : 2);
    carShortest.price = (carShortest.distance / 100) * fuelPrice * input.fuelConsumption * (input.oneWay ? 1 : 2);

    const ticketInfos = hvv?.schedules?.[0]?.tariffInfos?.[0]?.ticketInfos ?? [];

    const hvvTickets = calculateTickets(input.adults, input.children, input.oneWay, ticketInfos);
    const hvvPrice = getPrice(hvvTickets);

    const hvvData = {
      duration: hvv?.schedules?.[0]?.time,
      price: hvvPrice,
      tickets: hvvTickets,
    };

    setResult((draft) => {
      if (draft.start !== locationStart?.name ?? '') {
        draft.start = locationStart?.name ?? '';
      }
      if (draft.dest !== locationDest?.name ?? '') {
        draft.dest = locationDest?.name ?? '';
      }

      if (JSON.stringify(draft.hvv) !== JSON.stringify(hvvData)) {
        draft.hvv = hvvData;
      }

      if (draft.fuelPrice !== fuelPrice) {
        draft.fuelPrice = fuelPrice;
      }

      if (JSON.stringify(draft.carShortest) !== JSON.stringify(carShortest)) {
        draft.carShortest = carShortest;
      }

      if (JSON.stringify(draft.carFastest) !== JSON.stringify(carFastest)) {
        draft.carFastest = carFastest;
      }

      if (draft.ready !== (carFastest.duration !== Infinity)) {
        draft.ready = carFastest.duration !== Infinity;
      }
    });
  }, [
    locationStart,
    locationDest,
    fuelPrice,
    directions,
    hvv,
    input.oneWay,
    input.fuelConsumption,
    input.adults,
    input.children,
    setResult,
  ]);

  useEffect(() => {
    const prices = (fuelData?.stations || [])
      .map((station) => station[input.fuelType])
      .filter((v) => v)
      .slice(0, 5);

    setFuelPrice(Math.min(...prices));
  }, [fuelData, input.fuelType]);

  return result;
};
