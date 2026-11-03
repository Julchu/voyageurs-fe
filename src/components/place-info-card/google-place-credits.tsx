import Image from "next/image";

// Credit fields and UI for the saved Google Maps implementation.
type GooglePhotoCreditsProps = {
  photo?: {
    googleAuthors?: { name: string; uri?: string; photoUri?: string }[];
    googleMapsUri?: string;
  };
};

type GooglePlaceCreditsProps = {
  googleAttributions?: { provider: string; uri?: string }[];
};

export const GooglePhotoCredits = ({ photo }: GooglePhotoCreditsProps) => {
  if (!photo?.googleAuthors?.length && !photo?.googleMapsUri) return null;

  return (
    <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-black/45 px-5 py-1 text-xs text-white">
      {photo.googleAuthors?.map((author, index) => (
        <a
          key={`${author.name}:${index}`}
          href={author.uri}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:underline"
        >
          {author.photoUri ? (
            <Image
              src={author.photoUri}
              unoptimized
              width={16}
              height={16}
              alt=""
              className="rounded-full"
            />
          ) : null}
          {author.name}
        </a>
      ))}
      {photo.googleMapsUri ? (
        <a
          href={photo.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          View on Google Maps
        </a>
      ) : null}
    </figcaption>
  );
};

export const GooglePlaceCredits = ({
  googleAttributions,
}: GooglePlaceCreditsProps) => {
  if (!googleAttributions?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {googleAttributions.map((attribution, index) => (
        <a
          key={`${attribution.provider}:${index}`}
          href={attribution.uri}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-600 hover:underline"
        >
          {attribution.provider}
        </a>
      ))}
    </div>
  );
};
