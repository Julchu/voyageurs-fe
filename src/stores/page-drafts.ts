import type { TripDto, TripPatch } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { isEqual, replaceIds } from "@/utils/data";
import { draftId } from "@/utils/trip-draft";

/*
 * Page drafts: unsaved edits from a page (stop details, calendar). Each page
 * keeps its own, so it can Save or Reset without touching the drawer.
 *
 *   baseline  the page's values as saved, for the drawer's current stops
 *   draft     the user's edits, plus the trip version they started from
 *   view      what the page shows: the draft fitted to the current stops,
 *             or the baseline when there's no draft
 *
 * A draft whose version is older than the saved trip was changed elsewhere.
 */

export type PageDraft<V = unknown> = { value: V; version?: number };

/** By trip ID, then page scope. */
export type PageDrafts = Record<string, Record<string, PageDraft>>;

export type PageContext = { trip: TripDraft; saved?: TripDto };

export type PageConfig<V> = {
  scope: string;
  baseline: (context: PageContext) => V;
  /** Fits an older draft to the current stops, e.g. after one was added or removed. */
  fit?: (draft: V, baseline: V) => V;
  toPatch: (view: V, context: PageContext) => TripPatch;
};

export const getPageDraft = (
  drafts: PageDrafts,
  trip: TripDraft,
  scope: string,
) => drafts[draftId(trip)]?.[scope];

/** Stores `draft` for the trip's page, or removes it when undefined. */
export const setPageDraft = (
  drafts: PageDrafts,
  trip: TripDraft,
  scope: string,
  draft?: PageDraft,
): PageDrafts => {
  const tripId = draftId(trip);
  const pages = { ...drafts[tripId] };
  if (draft) pages[scope] = draft;
  else delete pages[scope];
  return { ...drafts, [tripId]: pages };
};

export const viewPage = <V>(
  page: PageConfig<V>,
  draft: PageDraft | undefined,
  context: PageContext,
) => {
  const baseline = page.baseline(context);
  const value = draft?.value as V | undefined;
  const view =
    value === undefined ? baseline : (page.fit?.(value, baseline) ?? value);
  return { baseline, view, isDirty: !isEqual(view, baseline) };
};

/** The draft after an edit. Undefined once it matches the baseline again. */
export const editPageDraft = <V>(
  page: PageConfig<V>,
  draft: PageDraft | undefined,
  context: PageContext,
  edit: (view: V) => V,
): PageDraft | undefined => {
  const { baseline, view, isDirty } = viewPage(page, draft, context);
  const value = edit(view);
  if (isEqual(value, baseline)) return undefined;
  // A new draft starts from the current saved version.
  return { value, version: isDirty ? draft?.version : context.saved?.version };
};

/**
 * After a save: drop the page that was saved, move the others to the saved
 * trip and stop IDs, and bring the up-to-date ones to the new version. Older
 * drafts keep their version, so they still show a conflict.
 */
export const rebasePageDrafts = (
  drafts: PageDrafts,
  submitted: TripDraft,
  saved: TripDto,
  savedScope?: string,
): PageDrafts => {
  const { [draftId(submitted)]: pages = {}, ...otherTrips } = drafts;
  const rebased = Object.entries(pages)
    .filter(([scope]) => scope !== savedScope)
    .map(([scope, draft]) => [
      scope,
      {
        value: replaceIds(draft.value, saved.stopIdMap ?? {}),
        version:
          draft.version === submitted.version ? saved.version : draft.version,
      },
    ]);
  return { ...otherTrips, [saved.publicId]: Object.fromEntries(rebased) };
};
