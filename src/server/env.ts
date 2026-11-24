import "server-only";

const need = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env ${key}`);
  return value;
};

/** Read per call, so `next build` works without runtime env. */
export const env = () => ({
  backendUrl: need("VOYAGEURS_BACKEND_URL"),
  accessKey: need("ACCESS_TOKEN_KEY"),
  refreshKey: need("REFRESH_TOKEN_KEY"),
});
