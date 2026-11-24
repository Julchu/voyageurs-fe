import type { NextRequest } from "next/server";
import { proxyJson } from "@/server/backend";

/** Tripadvisor photos for a POI (`?name=&lat=&lng=&mapboxId=`). Terra terms: never cache or index them. */
export const GET = async (request: NextRequest) => {
  const response = await proxyJson(
    `tripadvisor/photos?${request.nextUrl.searchParams}`,
  );
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
};
