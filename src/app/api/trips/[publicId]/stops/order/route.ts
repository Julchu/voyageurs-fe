import { proxyJson } from "@/utils/backend-proxy";

type OrderRouteContext = {
  params: Promise<{ publicId: string }>;
};

export const PUT = async (request: Request, context: OrderRouteContext) => {
  const { publicId } = await context.params;
  const body = await request.text();
  return proxyJson(`trips/${publicId}/stops/order`, { method: "PUT", body }, "trips");
};
