import stringSimilarity from 'string-similarity';
import useSWR from 'swr/immutable';
import shallow from 'zustand/shallow';
import { getJSON } from '../lib/helper';
import { useStore } from '../lib/store';
import { useDebounce } from './useDebounce';

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

type CNResponse = {
  returnCode: string;
  results: [
    {
      name: string;
      city: string;
      combinedName: string;
      id: string;
      globalId: string;
      type: 'STATION' | 'ADDRESS' | 'POI' | 'COORDINATE';
      coordinate: {
        x: number;
        y: number;
      };
      serviceTypes: string[];
      hasStationInformation: boolean;
    }
  ];
};

export const useGeocode = (key: 'start' | 'dest') => {
  const { target } = useStore((state) => ({ target: state?.input?.[key] }), shallow);

  const debouncedTarget: string = useDebounce<string>(target, 500);

  const swrMapBox = useSWR<FeatureCollection>(
    debouncedTarget ? ['/api/geocode', { target: debouncedTarget }] : null,
    getJSON
  );
  const swrHvv = useSWR<CNResponse>(debouncedTarget ? ['/api/hvv-check-name', { q: debouncedTarget }] : null, getJSON);

  const hvvData = {
    latitude: swrHvv?.data?.results?.[0]?.coordinate?.y,
    longitude: swrHvv?.data?.results?.[0]?.coordinate?.x,
    name: swrHvv?.data?.results?.[0]?.combinedName,
    text: swrHvv?.data?.results?.[0]?.name,
  };

  const mapBoxData = {
    latitude: swrMapBox?.data?.features?.[0]?.center?.[1],
    longitude: swrMapBox?.data?.features?.[0]?.center?.[0],
    name: swrMapBox?.data?.features?.[0]?.place_name,
    text: swrMapBox?.data?.features?.[0]?.text,
  };

  const hvvSimilarity = stringSimilarity.compareTwoStrings(target.toLowerCase(), hvvData?.text?.toLowerCase() ?? '');
  const mapBoxSimilarity = stringSimilarity.compareTwoStrings(
    target.toLowerCase(),
    mapBoxData?.text?.toLowerCase() ?? ''
  );

  const data = hvvSimilarity > mapBoxSimilarity ? hvvData : mapBoxData;

  return { data: data, error: swrMapBox.error || swrHvv.error };
};
