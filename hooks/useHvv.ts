import { useEffect, useState } from 'react';
import useSWR from 'swr/immutable';
import {
  HVV_TARIFF_DAY,
  HVV_TARIFF_DAY_CHILD,
  HVV_TARIFF_GERMANY_TICKET,
  HVV_TARIFF_GROUP,
  HVV_TARIFF_SINGLE,
  HVV_TARIFF_SINGLE_CHILD,
} from '../constants/hvv';
import { getJSON } from '../lib/helper';
import { useAppContext } from '../lib/store';

import type { GeoJson, HvvResponse, HvvResult, HvvSchedule, Location, TicketInfo } from '../lib/types';

export const getPrice = (ticketInfos: TicketInfo[]) => {
  const price = ticketInfos.reduce((res, info) => res + info?.basePrice ?? 0, 0);
  return Math.round(price * 100) / 100;
};

export const calculateTickets = (
  adults: number,
  children: number,
  twoWay: boolean,
  ticketInfos: TicketInfo[]
): TicketInfo[] => {
  const hvvAdultSingle = ticketInfos.find((info) => info.tariffKindID === HVV_TARIFF_SINGLE);
  const hvvAdultDay = ticketInfos.find((info) => info.tariffKindID === HVV_TARIFF_DAY);
  const hvvChildSingle = ticketInfos.find((info) => info.tariffKindID === HVV_TARIFF_SINGLE_CHILD);
  const hvvChildDay = ticketInfos.find((info) => info.tariffKindID === HVV_TARIFF_DAY_CHILD);
  const hvvGroup = ticketInfos.find((info) => info.tariffKindID === HVV_TARIFF_GROUP);
  const specialTicket = ticketInfos.find((info) => info.tariffKindID === HVV_TARIFF_GERMANY_TICKET);

  const ticketsAdult = (
    !twoWay ? [hvvAdultSingle] : hvvAdultDay ? [hvvAdultDay] : [hvvAdultSingle, hvvAdultSingle]
  ).filter((v) => v);
  const ticketsChild = (
    !twoWay ? [hvvChildSingle] : hvvChildDay ? [hvvChildDay] : [hvvChildSingle, hvvChildSingle]
  ).filter((v) => v);

  // Validierung: Erwachsenen-Tickets erforderlich, wenn Erwachsene vorhanden sind
  // Kinder-Tickets erforderlich, wenn Kinder vorhanden sind
  if ((adults > 0 && !ticketsAdult.length) || (children > 0 && !ticketsChild.length)) {
    return [];
  }

  const specialTickets = Array.from(Array(Math.max(0, adults + children)))
    .map(() => specialTicket)
    .filter((v) => v);

  const specialPrice = getPrice(specialTickets);
  const naivePrice =
    (adults > 0 ? getPrice(ticketsAdult) * adults : 0) + (children > 0 ? getPrice(ticketsChild) * children : 0);
  let dayPrice = Infinity;
  let dayTickets = [];

  // hvvAdultDay deckt 1 Erwachsenen + bis zu 3 Kinder ab
  if (adults > 0 && hvvAdultDay) {
    const coveredChildren = Math.min(children, 3);
    const remainingChildren = Math.max(0, children - coveredChildren);
    const remainingAdults = adults - 1;

    const additionalTickets = calculateTickets(remainingAdults, remainingChildren, twoWay, ticketInfos);
    dayTickets = [hvvAdultDay, ...additionalTickets];
    dayPrice = getPrice(dayTickets);
  }
  let groupPrice = Infinity;
  let groupTickets = [];

  // hvvGroup deckt bis zu 5 Personen (Erwachsene oder Kinder) ab
  if (adults + children > 1 && hvvGroup) {
    if (adults + children <= 5) {
      groupTickets = [hvvGroup];
      groupPrice = getPrice(groupTickets);
    } else {
      // Mehr als 5 Personen: Gruppenticket für 5 Personen + zusätzliche Tickets für die verbleibenden
      const totalPeople = adults + children;
      const remainingPeople = totalPeople - 5;

      // Verteile die verbleibenden Personen: priorisiere Erwachsene, dann Kinder
      const remainingAdults = Math.max(0, adults - Math.min(adults, 5));
      const remainingChildren = Math.max(0, remainingPeople - remainingAdults);

      const additionalTickets = calculateTickets(remainingAdults, remainingChildren, twoWay, ticketInfos);
      groupTickets = [hvvGroup, ...additionalTickets];
      groupPrice = getPrice(groupTickets);
    }
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

  return prices
    .filter((price) => !!price?.tickets?.length)
    .reduce(
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
    const hvvTickets = calculateTickets(input.adults, input.children, input.twoWay, ticketInfos);
    const hvvPrice = getPrice(hvvTickets);

    setResult({
      duration: swr.data?.schedules?.[0]?.time,
      price: hvvPrice,
      tickets: hvvTickets,
      geojson: getGeojson(swr.data?.schedules?.[0]),
    });
  }, [input.adults, input.children, input.twoWay, swr.data]);

  return {
    ...swr,
    result,
  };
};
