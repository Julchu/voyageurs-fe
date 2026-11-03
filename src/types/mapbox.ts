// Mapbox's category catalog is open-ended; these IDs are not a fixed enum.
export type MapboxCategoryId = string;

export type MapboxPhoto =
  | string
  | { url?: string; width?: number | null; height?: number | null };

export type MapboxMetadata = {
  primary_photo?: MapboxPhoto | MapboxPhoto[];
  photos?: MapboxPhoto[];
  website?: string;
  phone?: string;
  opening_hours?: string;
};

export type MapboxSuggestion = {
  mapbox_id?: string;
  name?: string;
  name_preferred?: string;
  feature_type?: string;
  address?: string;
  place_formatted?: string;
  poi_category?: string[];
  poi_category_ids?: MapboxCategoryId[];
};

export type MapboxSearchFeature = {
  properties?:
    | (MapboxSuggestion & {
        context?: {
          address?: { name?: string };
          street?: { name?: string };
        };
        coordinates?: { longitude?: number; latitude?: number };
        metadata?: MapboxMetadata;
      })
    | null;
  geometry?: { coordinates?: number[] };
};

export type MapboxSearchResponse = { features?: MapboxSearchFeature[] };

// Places Details returns a flat record, unlike Search Box's GeoJSON.
export type MapboxPlaceRecord = {
  mapbox_id?: string;
  name?: string;
  primary_category?: MapboxCategoryId;
  categories?: MapboxCategoryId[];
  coordinates?: { latitude?: number; longitude?: number };
  address?: {
    address_line_1?: string;
    address_number?: string;
    street_name?: string;
    locality?: string;
    city?: string;
    postcode?: string;
  };
  photos?: MapboxPhoto[];
  website?: string;
  phone?: string;
  opening_hours?: string;
  permanently_closed?: boolean | null;
  score?: { popularity?: number | null };
};
