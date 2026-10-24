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
  NIGHT: "night",
  DAWN: "dawn",
  DAY: "day",
  DUSK: "dusk",
} as const;
export const MapTimeValues = [
  MapTimeEnum.NIGHT,
  MapTimeEnum.DAWN,
  MapTimeEnum.DAY,
  MapTimeEnum.DUSK,
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

export type PlacePhoto = {
  url: string;
  width?: number | null;
  height?: number | null;
};

export type PlaceDetails = {
  website?: string;
  phone?: string;
  openingHours?: string;
  popularity?: number | null;
  permanentlyClosed?: boolean | null;
  photos: PlacePhoto[];
};

export type Place = {
  // Numeric feature id from the Standard style featureset (POI/landmark click).
  id?: number;
  // Opaque provider id: Google place id, or a legacy Mapbox `urn:mbxpoi:...`.
  mapboxId?: string;
  name: string;
  category: string;
  streetAddress: string;
  areaAddress: string;
  coordinates: Coordinates;
  // Photo URLs returned by the place provider (optional/not guaranteed).
  photos?: PlacePhoto[];
  // A successful lookup may legitimately return no photos or address.
  placeInfoLoaded?: boolean;
  details?: PlaceDetails;
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
  clientId?: string;
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
