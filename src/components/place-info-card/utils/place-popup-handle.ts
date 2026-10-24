import { Dialog } from "@base-ui/react/dialog";
import type { Place } from "@/utils/interfaces";

type PlacePopupPayload = Place & { clientId?: string; publicId?: string };

// Shared by the map, search, and card without a circular component import.
export const openPlacePopup = Dialog.createHandle<PlacePopupPayload>();
