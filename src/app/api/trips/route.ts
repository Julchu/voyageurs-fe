import { proxyJson } from "@/utils/backend-proxy";

export const GET = async () => proxyJson("trips", undefined, "trips");

export const POST = async (request: Request) => {
  const body = await request.text();
  return proxyJson("trips", { method: "POST", body }, "trips");
};
