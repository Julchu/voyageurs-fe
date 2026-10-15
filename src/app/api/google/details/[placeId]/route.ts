import { NextRequest } from "next/server";
import { googleProxy } from "@/utils/google-maps-server";

type Context = { params: Promise<{ placeId: string }> };

/**
 * Place Details (New). Two field masks map to two billing tiers:
 * - `basic`: the card essentials (name, address, category, location, photos).
 * - `full`: lazy "see more" extras (contact, hours, status) — fetched on demand.
 * Masks are fixed server-side so the client can never widen the billed tier.
 */
const BASIC_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "addressComponents",
  "types",
  "primaryTypeDisplayName",
  "location",
  "photos",
].join(",");

const FULL_MASK = [
  "id",
  "displayName",
  "websiteUri",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "regularOpeningHours",
  "businessStatus",
  "photos",
].join(",");

export const GET = async (request: NextRequest, context: Context) => {
  const { placeId } = await context.params;
  const tier = request.nextUrl.searchParams.get("tier") === "full" ? "full" : "basic";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken");

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
  );
  // Reusing the autocomplete session token here closes the billed session.
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  return googleProxy(url.toString(), tier === "full" ? FULL_MASK : BASIC_MASK);
};
