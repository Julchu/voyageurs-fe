import { proxyJson } from "@/server/backend";

type Context = RouteContext<"/api/trips/[publicId]">;

// Encoded so the ID can't reach another backend path.
const tripPath = async (ctx: Context) =>
  `trips/${encodeURIComponent((await ctx.params).publicId)}`;

export const PATCH = async (request: Request, ctx: Context) =>
  proxyJson(await tripPath(ctx), {
    method: "PATCH",
    body: await request.text(),
  });

export const DELETE = async (_request: Request, ctx: Context) =>
  proxyJson(await tripPath(ctx), { method: "DELETE" });
