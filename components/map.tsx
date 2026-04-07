import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import MapboxMap, { Source, Layer, MapRef, Marker } from "react-map-gl";
import { useTravelCosts } from "../hooks/useTravelCosts";
import {
  colorCarFastest,
  colorCarShortest,
  colorTrain,
} from "../lib/constants";
import { AlongRouteStation, GeoJson } from "../lib/types";
import { Color } from "./color";

const layerStyleCarFastest: mapboxgl.LineLayer = {
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  id: "geojson-car-layer-fastest",
  paint: {
    "line-color": colorCarFastest,
    "line-width": 3,
  },
};

const layerStyleCarShortest: mapboxgl.LineLayer = {
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  id: "geojson-car-layer-shortest",
  paint: {
    "line-color": colorCarShortest,
    "line-width": 3,
  },
};

const layerStyleTrain: mapboxgl.LineLayer = {
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  id: "geojson-train-layer",
  paint: {
    "line-color": colorTrain,
    "line-width": 3,
    "line-dasharray": [1, 2],
  },
};

// const a:mapboxgl.GeoJSONSourceOptions

const extendBounds = (bounds: mapboxgl.LngLatBounds, geoJson: GeoJson) => {
  geoJson?.features?.forEach((feature) => {
    if ("coordinates" in feature.geometry) {
      feature.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord);
      });
    }
  });

  return bounds;
};

const extendBoundsWithStation = (
  bounds: mapboxgl.LngLatBounds,
  station: AlongRouteStation | undefined,
) => {
  if (station) {
    bounds.extend([station.station.lng, station.station.lat]);
  }
  return bounds;
};

type LegendProps = {
  label: string;
  color: string;
  dashed?: boolean;
};
const Legend = (props: LegendProps) => {
  return (
    <div className="flex items-center gap-2">
      <Color color={props.color} dashed={props.dashed} />
      <span className="text-xs text-muted-foreground">{props.label}</span>
    </div>
  );
};

const formatMarkerPrice = (price: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

const GasStationMarker = ({
  station,
}: {
  station: AlongRouteStation;
}) => (
  <Marker
    longitude={station.station.lng}
    latitude={station.station.lat}
    anchor="bottom"
  >
    <div
      className="flex flex-col items-center"
      title={`${station.station.name} (${formatMarkerPrice(station.station.price)})`}
    >
      <div className="rounded-lg border border-border bg-card shadow-md px-2 py-1 text-xs font-medium whitespace-nowrap">
        ⛽ {station.station.brand || station.station.name} · {formatMarkerPrice(station.station.price)}
      </div>
      <div
        className="w-0 h-0"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid hsl(var(--border))",
        }}
      />
      <div className="w-2 h-2 rounded-full bg-red-500 border border-white shadow -mt-[2px]" />
    </div>
  </Marker>
);

process.env.REACT_APP_MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN;

export const Map = (props) => {
  const result = useTravelCosts();
  const mapRef = useRef<MapRef>(null);
  const [hasTrain, setHasTrain] = useState(false);
  const [hasFastest, setHasFastest] = useState(false);
  const [hasShortest, setHasShortest] = useState(false);

  useEffect(() => {
    if (result?.start?.latitude && result?.dest?.latitude) {
      // Create a 'LngLatBounds' with both corners at the first coordinate.
      const bounds = new mapboxgl.LngLatBounds(
        [result.start.longitude, result.start.latitude],
        [result.dest.longitude, result.dest.latitude],
      );

      const trainAvailable =
        Boolean(result?.hvv?.duration) || Boolean(result?.db?.geojson);
      const fastestAvailable =
        Boolean(result?.carFastest?.duration) &&
        result?.carFastest?.distance !== result?.carShortest?.distance;
      const shortestAvailable = Boolean(result?.carShortest?.duration);

      if (trainAvailable) {
        const trainGeoJson = result?.hvv?.duration
          ? result?.hvv?.geojson
          : result?.db?.geojson;
        if (trainGeoJson) {
          extendBounds(bounds, trainGeoJson);
        }
      }

      if (shortestAvailable && result?.carShortest?.geojson) {
        extendBounds(bounds, result.carShortest.geojson);
      }

      if (fastestAvailable && result?.carFastest?.geojson) {
        extendBounds(bounds, result.carFastest.geojson);
      }

      extendBoundsWithStation(bounds, result?.carShortest?.station);
      (result?.fastestOnRouteStations ?? []).forEach((station) =>
        extendBoundsWithStation(bounds, station),
      );

      mapRef?.current?.getMap()?.fitBounds(bounds, { padding: 40 });

      setHasTrain(trainAvailable);
      setHasFastest(fastestAvailable);
      setHasShortest(shortestAvailable);
    } else if (result?.start?.latitude) {
      mapRef?.current
        ?.getMap()
        ?.setCenter([result.start.longitude, result.start.latitude]);
      mapRef?.current?.getMap()?.setZoom(13);
    } else if (result?.dest?.latitude) {
      mapRef?.current
        ?.getMap()
        ?.setCenter([result.dest.longitude, result.dest.latitude]);
      mapRef?.current?.getMap()?.setZoom(13);
    }
  }, [result]);

  // console.log(result?.carShortest?.geojson);
  // console.log(result?.db?.geojson);

  return (
    <div className="flex flex-col">
      <div className={props.className}>
        <MapboxMap
          reuseMaps={true}
          attributionControl={false}
          scrollZoom={true}
          touchPitch={true}
          touchZoomRotate={true}
          dragPan={true}
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
            <Source
              id="geojson-train"
              key="geojson-train"
              type="geojson"
              data={result?.hvv?.geojson}
            >
              <Layer {...layerStyleTrain} />
            </Source>
          )}
          {!result?.hvv?.duration && result?.db?.geojson && (
            <Source
              id="geojson-train"
              key="geojson-train"
              type="geojson"
              data={result?.db?.geojson}
            >
              <Layer {...layerStyleTrain} />
            </Source>
          )}

          {result?.carFastest?.geojson && (
            <Source
              id="geojson-car-fastest"
              key="geojson-car-fastest"
              type="geojson"
              data={result?.carFastest?.geojson}
            >
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

          {result?.carShortest?.station && (
            <GasStationMarker station={result.carShortest.station} />
          )}

          {(result?.fastestOnRouteStations ?? [])
            .filter(
              (station) =>
                station.station.id !== result?.carShortest?.station?.station.id,
            )
            .map((station) => (
              <GasStationMarker
                key={`fastest-fuel-${station.station.id}`}
                station={station}
              />
            ))}
        </MapboxMap>
      </div>
      <div className="relative z-10 px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 bg-card border-t">
        {hasTrain && (
          <Legend
            color={colorTrain}
            dashed
            label={result?.hvv?.duration ? "HVV" : "Deutsche Bahn"}
          />
        )}
        {hasFastest && hasShortest && (
          <>
            <Legend color={colorCarShortest} label="Auto (kürzeste Route)" />
            <Legend color={colorCarFastest} label="Auto (schnellste Route)" />
          </>
        )}
        {!hasFastest && hasShortest && (
          <Legend color={colorCarShortest} label="Auto" />
        )}
      </div>
    </div>
  );
};
