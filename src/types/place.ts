export type Coordinates = { lat: number; lng: number };

export type PlacePhoto = {
  url: string;
  width?: number | null;
  height?: number | null;
  // Set for third-party photos that require on-image credit (display only).
  provider?: "tripadvisor";
  author?: string;
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
  mapboxId?: string;
  name: string;
  category: string;
  streetAddress: string;
  areaAddress: string;
  coordinates: Coordinates;
  // Photo URLs returned by the place provider (optional/not guaranteed).
  photos?: PlacePhoto[];
  // Link-back required wherever Tripadvisor photos are shown (display only, never persisted).
  tripadvisorUrl?: string;
  // A successful lookup may legitimately return no photos or address.
  placeInfoLoaded?: boolean;
  placeDetails?: PlaceDetails;
};

export type PlaceSearch = Place & {
  clientId?: string;
  publicId?: string;
  query: string;
  searchedAt: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PlaceSearchInput = Place & {
  query: string;
};
