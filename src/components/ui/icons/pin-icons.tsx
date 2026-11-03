import { SVGProps } from "react";
import { cn } from "cn";

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
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
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

// tabler:map-pin-check
export const MapPinCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
      <path d="M11.87 21.48a2 2 0 0 1-1.283-.58l-4.244-4.243a8 8 0 1 1 13.355-3.474M15 19l2 2l4-4" />
    </g>
  </svg>
);

// material-symbols:edit-location-alt-outline
// Large pin with pencil top right
export const PencilPinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeWidth={"1.5"}
      d="M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2q.675 0 1.338.113t1.287.312L13 4.075q-.25-.05-.488-.062T12 4Q9.475 4 7.738 5.738T6 10.2q0 1.775 1.475 4.063T12 19.35q3.05-2.8 4.525-5.087T18 10.2q0-.3-.025-.6t-.075-.575l1.65-1.65q.225.65.338 1.35T20 10.2q0 2.5-1.987 5.438T12 22m6.35-18.15L17.2 2.7L11 8.9V11h2.1l6.2-6.2zM20 4.1l.7-.7q.275-.275.275-.7T20.7 2l-.7-.7q-.275-.275-.7-.275t-.7.275l-.7.7z"
    />
  </svg>
);

// tabler:map-pin-share
// Pin with arrow bottom right, pointing top right
export const PinArrowIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    {...props}
  >
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
      <path d="M12.02 21.485a2 2 0 0 1-1.433-.585l-4.244-4.243a8 8 0 1 1 13.403-3.651M16 22l5-5m0 4.5V17h-4.5" />
    </g>
  </svg>
);

// tabler:filter-2-pin
export function PinMenuButton(props: SVGProps<SVGSVGElement>) {
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
        d="M4 6h16M6 12h10m-7 6h3m7 0v.01m2.121 2.111a3.005 3.005 0 0 0-.454-4.616a3 3 0 0 0-3.334 0a3 3 0 0 0-.454 4.616Q17.506 20.749 19 22q1.577-1.335 2.121-1.879L19 18"
      />
    </svg>
  );
}

// tabler:map-pin-filled
export function MapPinFilled(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203.21l-4.243 4.242a3 3 0 0 1-4.097.135l-.144-.135l-4.244-4.243A9 9 0 0 1 18.364 4.636M12 8a3 3 0 1 0 0 6a3 3 0 0 0 0-6" />
    </svg>
  );
}

export const AnimatedPinFilledIcon = ({
  className,
  ...svgProps
}: SVGProps<SVGSVGElement>) => {
  const shared = cn("h-10 w-10 stroke-[1.5]", className);

  return (
    <>
      <MapPinFilled className={cn("absolute", shared)} {...svgProps} />
      <MapPinFilled className={cn("animate-ping", shared)} {...svgProps} />
    </>
  );
};