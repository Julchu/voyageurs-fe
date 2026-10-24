import { SVGProps } from "react";

// tabler:map-pin-pin
export const CurrentLocationPinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
      <path d="M12.783 21.326a2 2 0 0 1-2.196-.426l-4.244-4.243A8 8 0 1 1 20 11.037" />
      <path d="M21.121 20.121a3 3 0 1 0-4.242 0Q17.506 20.749 19 22q1.577-1.335 2.121-1.879M19 18v.01" />
    </g>
  </svg>
);

// tabler:map-pin
export const CurrentLocationIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={"1.5"}>
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
      <path d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0" />
    </g>
  </svg>
);

// tabler:map-pin-x
export const PinRemoveIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
      <path d="M13.024 21.204a2 2 0 0 1-2.437-.304l-4.244-4.243a8 8 0 1 1 13.119-2.766M22 22l-5-5m0 5l5-5" />
    </g>
  </svg>
);

// tabler:map-pin-plus
export const PinAddIcon = (props: SVGProps<SVGSVGElement>) => (
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
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
      <path d="M12.794 21.322a2 2 0 0 1-2.207-.422l-4.244-4.243a8 8 0 1 1 13.59-4.616M16 19h6m-3-3v6" />
    </g>
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

// lucide:map-pin-house
// Pin with map icon bottom right
export const PinMapIcon = (props: SVGProps<SVGSVGElement>) => (
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
      <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1zm3-12a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2M18 22v-3" />
      <circle cx="10" cy="10" r="3" />
    </g>
  </svg>
);

// tabler:pencil-pin
// Large pencil with pin icon bottom right
export const PinPencilIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1zm3-12a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2M18 22v-3" />
      <circle cx="10" cy="10" r="3" />
    </g>
  </svg>
);