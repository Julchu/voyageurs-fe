import type { PlacePhoto } from "@/types/place";

/**
 * Required Tripadvisor attribution for a displayed photo: the mark plus a
 * link back to the location page. Links are `nofollow` and the text is
 * `data-nosnippet` so the display stays non-indexable.
 *
 * TODO: replace the text mark with the official logo asset from Tripadvisor's
 * partner brand guidelines before shipping.
 */
export const TripadvisorPhotoCredits = ({
  photo,
  tripadvisorUrl,
}: {
  photo: PlacePhoto;
  tripadvisorUrl?: string;
}) => {
  if (photo.provider !== "tripadvisor" || !tripadvisorUrl) return null;

  return (
    <figcaption
      data-nosnippet
      className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-2 bg-black/45 px-5 py-1 text-xs text-white"
    >
      {photo.author ? (
        <span className="truncate">Photo: {photo.author}</span>
      ) : null}
      <a
        href={tripadvisorUrl}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="ml-auto font-semibold hover:underline"
      >
        View on Tripadvisor
      </a>
    </figcaption>
  );
};
