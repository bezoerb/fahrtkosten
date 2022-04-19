import shallow from 'zustand/shallow';

import useSWR from 'swr';

import { getJSON } from '../lib/helper';
import { useStore } from '../lib/store';

type Context = {
  id: string;
  text_de: string;
  text: string;

  short_code?: string;
  wikidata?: string;
  language_de?: string;
  language?: string;
};

type Feature = {
  id: string;
  type: 'Feature';
  place_type: Array<string>;
  relevance: number;
  properties: {
    [x: string]: string;
  };
  text_de: string;
  place_name_de: string;
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  context: Array<Context>;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  query: Array<string>;
  features: Array<Feature>;
  attribution: string;
};

export const useGeocode = (key: 'start' | 'dest') => {
  const { target } = useStore((state) => ({ target: state?.input?.[key] }), shallow);

  const swr = useSWR<FeatureCollection>(target ? ['/api/geocode', { target }] : null, getJSON);

  const data = swr.data
    ? {
        latitude: swr?.data?.features?.[0]?.center?.[1],
        longitude: swr?.data?.features?.[0]?.center?.[0],
        name: swr?.data?.features?.[0]?.place_name,
      }
    : null;

  return { data, error: swr.error };
};
