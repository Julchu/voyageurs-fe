export const backendUrl = () =>
  process.env.VOYAGEURS_BACKEND_URL ?? process.env.TEAWORK_BACKEND_URL ?? "";
