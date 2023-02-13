import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import MapboxMap, { Source, Layer, MapRef } from 'react-map-gl';
import { useTravelCosts } from '../hooks/useTravelCosts';
import { colorCarFastest, colorCarShortest, colorTrain } from '../lib/constants';
import { GeoJson } from '../lib/types';
import { Color } from './color';

const layerStyleCarFastest: mapboxgl.LineLayer = {
  type: 'line',
  source: 'route',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  id: 'geojson-car-layer-fastest',
  paint: {
    'line-color': colorCarFastest,
    'line-width': 3,
  },
};

const layerStyleCarShortest: mapboxgl.LineLayer = {
  type: 'line',
  source: 'route',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  id: 'geojson-car-layer-shortest',
  paint: {
    'line-color': colorCarShortest,
    'line-width': 3,
  },
};

const layerStyleTrain: mapboxgl.LineLayer = {
  type: 'line',
  source: 'route',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  id: 'geojson-train-layer',
  paint: {
    'line-color': colorTrain,
    'line-width': 3,
    'line-dasharray': [1, 2],
  },
};

// const a:mapboxgl.GeoJSONSourceOptions

const extendBounds = (bounds: mapboxgl.LngLatBounds, geoJson: GeoJson) => {
  geoJson?.features?.forEach((feature) => {
    if ('coordinates' in feature.geometry) {
      feature.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord);
      });
    }
  });

  return bounds;
};

type LegendProps = {
  label: string;
  color: string;
  dashed?: boolean;
};
const Legend = (props: LegendProps) => {
  return (
    <div className="flex items-center justify-start">
      <Color color={props.color} dashed={props.dashed} />
      <span className="ml-3 text-sm">{props.label}</span>
    </div>
  );
};

process.env.REACT_APP_MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN;

export const Map = (props) => {
  const result = useTravelCosts();
  const mapRef = useRef<MapRef>();
  const [hasTrain, setHasTrain] = useState(false);
  const [hasFastest, setHasFastest] = useState(false);
  const [hasShortest, setHasShortest] = useState(false);

  useEffect(() => {
    if (result?.start?.latitude && result?.dest?.latitude) {
      // Create a 'LngLatBounds' with both corners at the first coordinate.
      const bounds = new mapboxgl.LngLatBounds(
        [result.start.longitude, result.start.latitude],
        [result.dest.longitude, result.dest.latitude]
      );

      const trainAvailable = Boolean(result?.hvv?.duration) || Boolean(result?.db?.geojson);
      const fastestAvailable =
        Boolean(result?.carFastest?.duration) && result?.carFastest?.distance !== result?.carShortest?.distance;
      const shortestAvailable = Boolean(result?.carShortest?.duration);

      if (trainAvailable) {
        extendBounds(bounds, result?.hvv?.duration ? result?.hvv?.geojson : result?.db?.geojson);
      }

      if (shortestAvailable) {
        extendBounds(bounds, result?.carShortest?.geojson);
      }

      if (fastestAvailable) {
        extendBounds(bounds, result?.carFastest?.geojson);
      }

      mapRef?.current?.getMap()?.fitBounds(bounds, { padding: 40 });

      setHasTrain(trainAvailable);
      setHasFastest(fastestAvailable);
      setHasShortest(shortestAvailable);
    } else if (result?.start?.latitude) {
      mapRef?.current?.getMap()?.setCenter([result.start.longitude, result.start.latitude]);
      mapRef?.current?.getMap()?.setZoom(13);
    } else if (result?.dest?.latitude) {
      mapRef?.current?.getMap()?.setCenter([result.dest.longitude, result.dest.latitude]);
      mapRef?.current?.getMap()?.setZoom(13);
    }
  }, [result]);

  console.log(result?.carShortest?.geojson);
  console.log(result?.db?.geojson);

  return (
    <div className={props.className}>
      <MapboxMap
        reuseMaps={true}
        attributionControl={false}
        scrollZoom={false}
        touchPitch={false}
        touchZoomRotate={false}
        dragPan={false}
        dragRotate={false}
        ref={mapRef}
        initialViewState={{
          zoom: 4,
          latitude: 51.1520101,
          longitude: 6.9574991,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      >
        {result?.hvv?.duration && result?.hvv?.geojson && (
          <Source id="geojson-train" key="geojson-train" type="geojson" data={result?.hvv?.geojson}>
            <Layer {...layerStyleTrain} />
          </Source>
        )}
        {!result?.hvv?.duration && result?.db?.geojson && (
          <Source id="geojson-train" key="geojson-train" type="geojson" data={result?.db?.geojson}>
            <Layer {...layerStyleTrain} />
          </Source>
        )}

        {result?.carFastest?.geojson && (
          <Source id="geojson-car-fastest" key="geojson-car-fastest" type="geojson" data={result?.carFastest?.geojson}>
            <Layer {...layerStyleCarFastest} />
          </Source>
        )}

        {result?.carShortest?.geojson && (
          <Source
            id="geojson-car-shortest"
            key="geojson-car-shortest"
            type="geojson"
            data={result?.carShortest?.geojson}
          >
            <Layer {...layerStyleCarShortest} />
          </Source>
        )}
      </MapboxMap>
      <div className="bg-white relative z-10 pt-3">
        {hasTrain && <Legend color={colorTrain} dashed label={result?.hvv?.duration ? 'HVV' : 'Deutsche Bahn'} />}
        {hasFastest && hasShortest && (
          <>
            <Legend color={colorCarShortest} label="Auto (kürzeste Route)" />
            <Legend color={colorCarFastest} label="Auto (schnellste Route)" />
          </>
        )}
        {!hasFastest && hasShortest && <Legend color={colorCarShortest} label="Auto (kürzeste Route)" />}
        <br />
        <></>
      </div>
    </div>
  );
};
