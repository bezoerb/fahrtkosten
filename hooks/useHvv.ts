import { useEffect, useState } from 'react';
import useSWR from 'swr/immutable';
import { getJSON } from '../lib/helper';
import { useAppContext } from '../lib/store';

import type { GeoJson, HvvResponse, HvvResult, HvvSchedule, Location, TicketInfo } from '../lib/types';

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

const getGeojson = (schedule: HvvSchedule): GeoJson => {
  const geometry: GeoJSON.Geometry = {
    type: 'LineString',
    coordinates:
      schedule?.scheduleElements?.flatMap((element) => {
        return element?.paths?.flatMap((path) => path?.track?.map((pos) => [pos.x, pos.y]) ?? []) ?? [];
      }) ?? [],
  };

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: geometry,
      },
    ],
  };
};

export const useHvv = (start: Location | undefined, end: Location | undefined) => {
  const [result, setResult] = useState<HvvResult>();

  const input = useAppContext((state) => state.input);
  const swr = useSWR<HvvResponse>(
    () =>
      start?.latitude && end?.latitude
        ? [
            '/api/hvv',
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

  useEffect(() => {
    const ticketInfos = swr.data?.schedules?.[0]?.tariffInfos?.[0]?.ticketInfos ?? [];
    const hvvTickets = calculateTickets(input.adults, input.children, input.oneWay, ticketInfos);
    const hvvPrice = getPrice(hvvTickets);

    setResult({
      duration: swr.data?.schedules?.[0]?.time,
      price: hvvPrice,
      tickets: hvvTickets,
      geojson: getGeojson(swr.data?.schedules?.[0]),
    });
  }, [input.adults, input.children, input.oneWay, swr.data]);

  return {
    ...swr,
    result,
  };
};
