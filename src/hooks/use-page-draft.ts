"use client";

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { getPageDraft, viewPage, type PageConfig } from "@/stores/page-drafts";
import {
  selectIsSaving,
  selectSavedTrip,
  selectTripDirty,
} from "@/stores/trip-store";

/** A page's draft on top of the saved trip, with Save/Reset that also cover the drawer. */
export function usePageDraft<V>(page: PageConfig<V>) {
  const isSignedIn = useUserStore(({ userInfo }) => !!userInfo);
  const {
    trip,
    saved,
    draft,
    isLoading,
    isSaving,
    drawerDirty,
    updatePage,
    resetPage,
    savePage,
    resetTrip,
  } = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      saved: selectSavedTrip(state),
      draft: getPageDraft(state.pageDrafts, state.currentTrip, page.scope),
      isLoading: state.tripsLoadState === "loading",
      isSaving: selectIsSaving(state),
      drawerDirty: selectTripDirty(state),
      updatePage: state.updatePage,
      resetPage: state.resetPage,
      savePage: state.savePage,
      resetTrip: state.resetTrip,
    })),
  );

  const { view, isDirty } = useMemo(
    () => viewPage(page, draft, { trip, saved }),
    [page, draft, trip, saved],
  );
  const conflict = isDirty && draft?.version !== saved?.version;

  const update = useCallback(
    (edit: (view: V) => V) => updatePage(page, edit),
    [page, updatePage],
  );
  const save = useCallback(() => savePage(page), [page, savePage]);
  const reset = useCallback(() => {
    resetTrip();
    resetPage(page.scope);
  }, [page, resetTrip, resetPage]);

  return {
    trip,
    saved,
    view,
    update,
    save,
    reset,
    isDirty: isDirty || drawerDirty,
    isPageDirty: isDirty,
    isSaving,
    // TODO: explain blocked saves (signed out, conflict) in the footer.
    canSave: isSignedIn && !conflict && !isLoading,
  };
}
