import { googleProxy } from "@/utils/google-maps-server";

/**
 * Places Autocomplete (New) — the cheap type-ahead SKU. Billed per session when
 * a `sessionToken` is passed and later reused on the matching Details call.
 */
const FIELD_MASK = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text",
  "suggestions.placePrediction.structuredFormat",
  "suggestions.placePrediction.types",
].join(",");

export const POST = async (request: Request) => {
  const body = await request.text();
  return googleProxy(
    "https://places.googleapis.com/v1/places:autocomplete",
    FIELD_MASK,
    { method: "POST", body },
  );
};
