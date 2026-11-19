"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { pageDraftOf, pageView, type PageConfig } from "@/stores/page-drafts";
import {
  selectIsSaving,
  selectSavedTrip,
  selectTripDirty,
} from "@/stores/trip-store";
import { isEqual } from "@/utils/data";

/**
 * A page's draft on top of the saved trip. `view` is what the page shows;
 * `update` stores a new view, or drops the draft once it matches the saved values.
 */
export function usePageDraft<V>(page: PageConfig<V>) {
  const isSignedIn = useUserStore(({ userInfo }) => !!userInfo);
  const state = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      saved: selectSavedTrip(state),
      draft: pageDraftOf(state.pageDrafts, state.currentTrip, page.scope),
      isLoading: state.tripsLoadState === "loading",
      isSaving: selectIsSaving(state),
      drawerDirty: selectTripDirty(state),
      setPageDraft: state.setPageDraft,
      savePage: state.savePage,
      resetTrip: state.resetTrip,
    })),
  );
  const { trip, saved, draft, isSaving, setPageDraft } = state;

  const latest = useMemo(
    () => page.latest({ trip, saved }),
    [page, trip, saved],
  );
  const view = useMemo(
    () => pageView(page, draft, { trip, saved }),
    [page, draft, trip, saved],
  );
  const isDirty = useMemo(() => !isEqual(view, latest), [view, latest]);
  const conflict = isDirty && draft?.version !== saved?.version;

  // One update per event: `next` gets the view from the last render.
  const update = (next: (view: V) => V) => {
    if (isSaving) return;
    const value = next(view);
    setPageDraft(
      page.scope,
      isEqual(value, latest)
        ? undefined
        : { value, version: isDirty ? draft?.version : saved?.version },
    );
  };

  const reset = () => {
    state.resetTrip();
    setPageDraft(page.scope, undefined);
  };

  return {
    trip,
    saved,
    view,
    update,
    reset,
    save: () => state.savePage(page),
    isDirty: isDirty || state.drawerDirty,
    isSaving,
    // TODO: explain blocked saves (signed out, conflict) in the footer.
    canSave: isSignedIn && !conflict && !state.isLoading,
  };
}
