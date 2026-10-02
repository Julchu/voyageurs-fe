import { SVGProps } from "react";

// tabler: current - location;
export const LocationIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    >
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
      <path d="M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0m8-10v2m0 16v2m8-10h2M2 12h2" />
    </g>
  </svg>
);

// tabler:navigation-north
export const NorthIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="m16 21l-4-8l-4 8l4-2zM10 9V3l4 6V3"
    />
  </svg>
);