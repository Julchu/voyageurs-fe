import { proxyJson } from "@/server/backend";

export const PATCH = async (
  request: Request,
  ctx: RouteContext<"/api/trips/[publicId]">,
) => {
  const { publicId } = await ctx.params;
  // Encoded so the ID can't reach another backend path.
  return proxyJson(`trips/${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    body: await request.text(),
  });
};
