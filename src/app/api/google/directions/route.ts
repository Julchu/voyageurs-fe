import { googleProxy } from "@/utils/google-maps-server";

/**
 * Routes API `computeRoutes`. We only need the overview geometry to draw the
 * line, so the field mask requests nothing but the encoded polyline — the
 * cheapest Routes tier. The client posts an already-shaped Routes request body.
 */
const GOOGLE_DIRECTIONS_FIELD_MASK = "routes.polyline.encodedPolyline";

export const POST = async (request: Request) => {
  const body = await request.text();
  return googleProxy(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    GOOGLE_DIRECTIONS_FIELD_MASK,
    { method: "POST", body, signal: request.signal },
  );
};
