import { proxyJson } from "@/utils/backend-proxy";

export const GET = async () => proxyJson("trips");

// TODO: rename all /trips to /stops
export const POST = async (request: Request) => {
  const body = await request.text();
  return proxyJson("trips", { method: "POST", body });
};