import { proxyJson } from "@/utils/backend-proxy";

type StopRouteContext = {
  params: Promise<{ publicId: string; stopPublicId: string }>;
};

export const PATCH = async (request: Request, context: StopRouteContext) => {
  const { publicId, stopPublicId } = await context.params;
  const body = await request.text();
  return proxyJson(`trips/${publicId}/stops/${stopPublicId}`, { method: "PATCH", body }, "trips");
};

export const DELETE = async (_request: Request, context: StopRouteContext) => {
  const { publicId, stopPublicId } = await context.params;
  return proxyJson(`trips/${publicId}/stops/${stopPublicId}`, { method: "DELETE" }, "trips");
};
