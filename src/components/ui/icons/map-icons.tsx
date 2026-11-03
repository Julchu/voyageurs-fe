import { SVGProps } from "react";

// tabler:map-check
export const MapSaveIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m11 18l-2-1l-6 3V7l6-3l6 3l6-3v9M9 4v13m6-10v8m0 4l2 2l4-4"
    />
  </svg>
);

// tabler:map-plus
export const MapAddIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 18.5L9 17l-6 3V7l6-3l6 3l6-3v8.5M9 4v13m6-10v8m1 4h6m-3-3v6"
    />
  </svg>
);

// tabler:map-search
export const MapSearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m11 18l-2-1l-6 3V7l6-3l6 3l6-3v7.5M9 4v13m6-10v5m0 6a3 3 0 1 0 6 0a3 3 0 1 0-6 0m5.2 2.2L22 22"
    />
  </svg>
);

// tabler:map-cog
export const MapSettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 18.5L9 17l-6 3V7l6-3l6 3l6-3v8M9 4v13m6-10v6.5m2.001 5.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0m2-3.5V17m0 4v1.5m3.031-5.25l-1.299.75m-3.463 2l-1.3.75m0-3.5l1.3.75m3.463 2l1.3.75"
    />
  </svg>
);

// tabler:map-2
// Map icon with pin icon bottom right
export const MapPinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 18.5L9 17l-6 3V7l6-3l6 3l6-3v7.5M9 4v13m6-10v5.5m6.121 7.621a3 3 0 1 0-4.242 0Q17.506 20.749 19 22q1.577-1.335 2.121-1.879M19 18v.01"
    />
  </svg>
);

// tabler:map-route
export function MapCurrentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m3 7l6-3l6 3l6-3v13l-6 3l-6-3l-6 3zm6 5v.01M6 13v.01M17 15l-4-4m0 4l4-4"
      />
    </svg>
  );
}

// tabler:pin-invoke
export function FlyToIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h9m4 2a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        <path d="M10 11h4v4m-4 0l4-4" />
      </g>
    </svg>
  );
}