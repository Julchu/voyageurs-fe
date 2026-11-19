import type { TripDto, TripPatch } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { remapIds } from "@/utils/data";
import { draftId } from "@/utils/trip-draft";

/**
 * Unsaved edits from a page (stop details, calendar), kept apart from the drawer
 * so each page can Save or Reset on its own. `version` is the trip version the
 * edits were based on; a newer saved version means someone else changed it.
 */
export type PageDraft<V = unknown> = { value: V; version?: number };

/** Drafts by trip ID, then page scope. */
export type PageDrafts = Record<string, Record<string, PageDraft>>;

export type PageContext = { trip: TripDraft; saved?: TripDto };

/** How a page reads, reconciles and saves its draft. */
export type PageConfig<V> = {
  scope: string;
  /** Page values as saved, for the drawer's current stops. */
  latest: (context: PageContext) => V;
  /** Fits a stored draft to the current stops, e.g. after one is added or removed. */
  reconcile?: (draft: V, latest: V) => V;
  toPatch: (view: V, context: PageContext) => TripPatch;
};

export const pageDraftOf = (
  drafts: PageDrafts,
  trip: TripDraft,
  scope: string,
) => drafts[draftId(trip)]?.[scope];

/** What the page shows: the draft fitted to the current stops, or the saved values. */
export const pageView = <V>(
  page: PageConfig<V>,
  draft: PageDraft | undefined,
  context: PageContext,
) => {
  const latest = page.latest(context);
  if (!draft) return latest;
  const value = draft.value as V;
  return page.reconcile ? page.reconcile(value, latest) : value;
};

export const withPageDraft = (
  drafts: PageDrafts,
  trip: TripDraft,
  scope: string,
  draft?: PageDraft,
): PageDrafts => {
  const key = draftId(trip);
  const pages = { ...drafts[key] };
  if (draft) pages[scope] = draft;
  else delete pages[scope];
  return { ...drafts, [key]: pages };
};

/**
 * After a save: move drafts to the saved trip and stop IDs, drop the page that
 * was saved, and rebase drafts that were up to date. Stale drafts keep their
 * old version so they still report a conflict.
 */
export const settlePageDrafts = (
  drafts: PageDrafts,
  submitted: TripDraft,
  saved: TripDto,
  savedScope?: string,
): PageDrafts => {
  const { [draftId(submitted)]: pages = {}, ...others } = drafts;
  const ids = saved.stopIdMap ?? {};
  const settled = Object.entries(pages)
    .filter(([scope]) => scope !== savedScope)
    .map(([scope, draft]) => [
      scope,
      {
        value: remapIds(draft.value, ids),
        version:
          draft.version === submitted.version ? saved.version : draft.version,
      },
    ]);
  return { ...others, [saved.publicId]: Object.fromEntries(settled) };
};
