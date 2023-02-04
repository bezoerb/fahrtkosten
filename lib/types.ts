export type Location = {
  latitude: number;
  longitude: number;
};

export type Position = Location & {
  name: string;
  text: string;
};

export enum FuelType {
  E5 = 'e5',
  E10 = 'e10',
  Diesel = 'diesel',
  All = 'all',
}

export type TankerkoenigStation = {
  id: string;
  name: string;
  brand: string;
  street: string;
  place: string;
  lat: number;
  lng: number;
  dist: number;
  diesel?: number;
  e5?: number;
  e10?: number;
  price?: number;
  isOpen: boolean;
  houseNumber: number | string;
  postCode: number | string;
};

export type TankerkoenigResponse = {
  ok: boolean;
  license: string;
  data: string;
  status: string;
  stations: TankerkoenigStation[];
};

export type MapboxLocation = [longitude: number, latitude: number];

export type MapboxWaypoint = {
  distance: number;
  name: string;
  location: MapboxLocation;
};

export type Route = {
  country_crossed: false;
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
  legs: [
    {
      via_waypoints: MapboxWaypoint[];
      admins: [
        {
          iso_3166_1_alpha3: string;
          iso_3166_1: string;
        }
      ];
      weight: number;
      duration: number;
      steps: unknown[];
      distance: number;
      summary: string;
    }
  ];
  geometry: GeoJSON.Geometry;
};

export type DirectionsResponse = {
  routes: Route[];
  waypoints: MapboxWaypoint[];
  code: string;
  uuid: string;
};

export type GeoJson = {
  type: 'FeatureCollection';
  features: [
    {
      type: 'Feature';
      properties: {};
      geometry: Route['geometry'];
    }
  ];
};

export type CarResult = {
  duration: number;
  distance: number;
  price: number;
  geojson: GeoJson;
};

type HvvCoordinateValue = {
  x: number;
  y: number;
};

type HvvCoordinate = {
  name: string;
  city: string;
  combinedName: string;
  type: string;
  coordinate: HvvCoordinateValue;
};

type HvvPath = {
  track: HvvCoordinateValue[];
  attributes: string[];
};

type HvvLine = {
  name: string;
  direction?: string;
  directionId?: number;
  origin?: string;
  type: {
    simpleType: string;
    shortInfo?: string;
    longInfo?: string;
    model?: string;
  };
  id?: string;
  carrierNameShort?: string;
  carrierNameLong?: string;
};

type HvvTariffRegion = {
  regionType: string;
  alternatives: [
    {
      regions: string[];
    }
  ];
};

export type TicketInfo = {
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

type HvvTariffInfo = {
  tariffName: string;
  tariffRegions: HvvTariffRegion[];
  extraFareType: string;
  ticketInfos: TicketInfo[];
};

type HvvScheduleElementLocation = {
  name: string;
  city: string;
  combinedName: string;
  id: string;
  globalId: string;
  type: string;
  coordinate: HvvCoordinateValue;
  serviceTypes: string[];
  hasStationInformation: true;
  depTime: {
    date: string;
    time: string;
  };
  platform: string;
  realtimePlatform: string;
};

type HvvAttribute = {
  title: string;
  isPlanned: boolean;
  value: string;
  types: string[];
  id: string;
};

type HvvScheduleElement = {
  from: HvvScheduleElementLocation;
  to: HvvScheduleElementLocation;
  line: HvvLine;
  paths: HvvPath[];
  attributes?: HvvAttribute[];
  serviceId?: number;
};

export type HvvSchedule = {
  routeId: number;
  start: HvvCoordinate;
  dest: HvvCoordinate;
  time: number;
  footpathTime: number;
  plannedDepartureTime: string;
  plannedArrivalTime: string;
  tariffInfos: HvvTariffInfo[];
  scheduleElements: HvvScheduleElement[];
}

export type HvvResponse = {
  returnCode: string;
  schedules: HvvSchedule[];
};

export type HvvResult = {
  price: number;
  duration: number;
  tickets: TicketInfo[];
  geojson: GeoJson;
};
