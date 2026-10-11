export const MapStyle = {
  standard: "standard",
  grey: "grey",
  nav: "nav",
  satellite: "satellite",
  pink: "pink",
  streets: "streets",
} as const;
export type MapStyle = (typeof MapStyle)[keyof typeof MapStyle];
export const Color = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type ColorMode = (typeof Color)[keyof typeof Color];

export type UserPreferences = {
  colorMode: ColorMode;
  displayName: string;
  mapStyle?: string;
  performanceMode: boolean;
};

export const MapTimeEnum = {
  night: "night",
  dawn: "dawn",
  day: "day",
  dusk: "dusk",
} as const;
export const MapTimeValues = [
  MapTimeEnum.night,
  MapTimeEnum.dawn,
  MapTimeEnum.day,
  MapTimeEnum.dusk,
];
export type MapTimeType = (typeof MapTimeValues)[number];
export type MapTime = (typeof MapTimeEnum)[keyof typeof MapTimeEnum];

export type Coordinates = { lat: number; lng: number };

export type UserInfo = {
  id: number;
  publicId?: string;
  email: string;
  name: string;
  image?: string | null;
  lastLocation?: Coordinates;
};

export type Place = {
  id: number;
  name: string;
  streetAddress: string;
  areaAddress: string;
  coordinates: Coordinates;
};

export type TripStop = Place & {
  // Local clientId separate from server publicId for easy removals/re-orders
  clientId?: string;
  publicId?: string;
  tripPublicId?: string;
  // Position: order
  position: number;
  visited: boolean;
  visitedAt: string | null;
};

export type Trip = {
  // Local clientId for a draft trip before the server assigns a publicId
  clientId?: string;
  publicId?: string;
  name: string;
  stops: TripStop[];
};

export type PlaceSearch = Place & {
  publicId?: string;
  query: string;
  searchedAt: string;
};

export type PlaceSearchInput = Place & {
  query: string;
};

type FormData<T> = Omit<T, "userId" | "tripId" | "stopId">;

export type TripStopFormData = FormData<TripStop>;

export type TripFormData = Omit<FormData<Trip>, "stops"> & {
  stops: TripStopFormData[];
};

// Geocoding v6 reverse response: each feature carries a formatted streetAddress in
// `properties`. `full_address` = name + place context; `name` is the bare
// street line. See https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding
export type GeocodeResponse = {
  features?: { properties?: GeocodeFeatures }[];
};

export type GeocodeFeatures = {
  full_address?: string;
  name?: string;
  name_preferred?: string;
  place_formatted?: string;
};