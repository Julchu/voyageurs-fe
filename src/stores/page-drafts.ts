import type { TripDto, TripPatch } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { isEqual, remapIds } from "@/utils/data";
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

/**
 * `view` is what the page shows: the draft fitted to the current stops, or the
 * saved values. It's dirty once it differs from them.
 */
export const readPage = <V>(
  page: PageConfig<V>,
  draft: PageDraft | undefined,
  context: PageContext,
) => {
  const latest = page.latest(context);
  const value = draft?.value as V | undefined;
  const view =
    value === undefined ? latest : (page.reconcile?.(value, latest) ?? value);
  return { latest, view, isDirty: !isEqual(view, latest) };
};

/** Next draft after an edit. Dropped once it matches the saved values again. */
export const editPage = <V>(
  page: PageConfig<V>,
  draft: PageDraft | undefined,
  context: PageContext,
  next: (view: V) => V,
): PageDraft | undefined => {
  const { latest, view, isDirty } = readPage(page, draft, context);
  const value = next(view);
  if (isEqual(value, latest)) return undefined;
  // A clean draft restarts from the current saved version.
  return { value, version: isDirty ? draft?.version : context.saved?.version };
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
