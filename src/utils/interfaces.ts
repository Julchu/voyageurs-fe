export type Coordinates = { lat: number; lng: number };

export const MapStyle = {
  standard: "standard",
  grey: "grey",
  nav: "nav",
  satellite: "satellite",
  pink: "pink",
  streets: "streets",
} as const;

export type MapStyle = (typeof MapStyle)[keyof typeof MapStyle];

export const MapTime = {
  night: "night",
  dawn: "dawn",
  day: "day",
  dusk: "dusk",
} as const;

export type MapTime = (typeof MapTime)[keyof typeof MapTime];

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
  lastLocation?: Coordinates;
};

export type UserInfo = {
  id: number;
  publicId: string;
  email: string;
  name: string;
  image?: string | null;
  preferences: UserPreferences;
};

export const TripStatus = {
  current: "current",
  previous: "previous",
} as const;

export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];

export type PlaceDraft = {
  name: string;
  address: string;
  coordinates: Coordinates;
};

export type TripStop = PlaceDraft & {
  publicId: string;
  position: number;
  visited: boolean;
  visitedAt: string | null;
};

export type Trip = {
  publicId: string;
  name: string;
  status: TripStatus;
  stops: TripStop[];
  remote: boolean;
};

export type ServerTrip = Omit<Trip, "remote">;

export type PlaceSearch = PlaceDraft & {
  publicId: string;
  query: string;
  searchedAt: string;
};

export type PlaceSearchInput = PlaceDraft & {
  query: string;
};
