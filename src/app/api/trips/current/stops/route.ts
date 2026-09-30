import { proxyJson } from "@/utils/backend-proxy";

export const POST = async (request: Request) => {
  const body = await request.text();
  return proxyJson("trips/current/stops", { method: "POST", body }, "trips");
};
