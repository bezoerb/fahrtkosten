import { useEffect } from 'react';
import { useGeolocated } from 'react-geolocated';
import useSWR from 'swr/immutable';
import { useImmer } from 'use-immer';
import { getJSON } from '../lib/helper';

type Location = {
  latitude: number | undefined;
  longitude: number | undefined;
  name: string;
  text: string;
};

export const useLocation = () => {
  const { coords, isGeolocationAvailable, isGeolocationEnabled, getPosition } = useGeolocated({
    suppressLocationOnMount: true,
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 10000,
  });

  const swr = useSWR(
    () =>
      coords?.latitude && coords?.longitude
        ? ['/api/geocode', { target: `${coords.longitude},${coords.latitude}` }]
        : null,
    getJSON
  );

  const [location, setLocation] = useImmer<Location>({
    latitude: undefined,
    longitude: undefined,
    name: '',
    text: '',
  });

  useEffect(() => {
    if (!coords?.latitude || !coords?.longitude) {
      return
    }
    const name: string = swr?.data?.features?.[0]?.place_name;
    const text: string = swr?.data?.features?.[0]?.text;

    setLocation((draft) => {
      if (coords.latitude && coords.latitude !== draft.latitude) {
        draft.latitude = coords.latitude;
      }
      if (coords.longitude && coords.longitude !== draft.longitude) {
        draft.latitude = coords.longitude;
      }
      if (name !== draft.name) {
        draft.name = name;
      }
      if (text !== draft.text) {
        draft.text = text;
      }
    });
  }, [coords?.latitude, coords?.longitude, setLocation, swr?.data]);


  return { ...swr,  location, getPosition, isGeolocationAvailable, isGeolocationEnabled };
};
