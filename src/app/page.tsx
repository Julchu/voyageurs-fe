import { MapWorkspace } from "@/components/map-box/map-workspace";
import type { Coordinates } from "@/utils/interfaces";

type HomeProps = {
  searchParams: Promise<{ lat?: string; lng?: string }>;
};

const focusFrom = (latValue: string | undefined, lngValue: string | undefined): Coordinates | undefined => {
  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  return { lat, lng };
};

export default async function Home({ searchParams }: HomeProps) {
  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return <div className="p-6">Missing NEXT_PUBLIC_MAPBOX_TOKEN</div>;
  }

  const params = await searchParams;
  const focus = focusFrom(params.lat, params.lng);

  return <MapWorkspace key={focus ? `${focus.lat}-${focus.lng}` : "map"} focus={focus} />;
}
