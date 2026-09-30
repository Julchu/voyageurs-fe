import { proxyJson } from "@/utils/backend-proxy";

export const GET = async () => proxyJson("searches", undefined, "searches");

export const POST = async (request: Request) => {
  const body = await request.text();
  return proxyJson("searches", { method: "POST", body }, "search");
};
