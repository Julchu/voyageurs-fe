import { googleProxy } from "@/utils/google-maps-server";

/**
 * Text Search (New). Used for the address-bar forward search and for resolving
 * a map POI click (name + location bias) to a Google place — Google has no
 * direct Mapbox-style `/reverse`-to-POI, so a biased text query is the analogue.
 */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.addressComponents",
  "places.types",
  "places.primaryTypeDisplayName",
  "places.location",
  "places.photos",
].join(",");

export const POST = async (request: Request) => {
  const body = await request.text();
  return googleProxy(
    "https://places.googleapis.com/v1/places:searchText",
    FIELD_MASK,
    { method: "POST", body },
  );
};
