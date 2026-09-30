import { proxyJson } from "@/utils/backend-proxy";

type TripRouteContext = {
  params: Promise<{ publicId: string }>;
};

export const PATCH = async (request: Request, context: TripRouteContext) => {
  const { publicId } = await context.params;
  const body = await request.text();
  return proxyJson(`trips/${publicId}`, { method: "PATCH", body }, "trips");
};
