import { SVGProps } from "react";

// ci:caret-circle-down
export const CaretCircleDownIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
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
        d="m15 11l-3 3l-3-3m12 1a9 9 0 1 0-18 0a9 9 0 0 0 18 0"
      />
    </svg>
  );
};

// ci:caret-circle-up
export const CaretCircleUpIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="m9 13l3-3l3 3m6-1a9 9 0 1 0-18 0a9 9 0 0 0 18 0"
    />
  </svg>
);

// ci:caret-up-md
export const CaretUpIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="m8 14l4-4l4 4"
    />
  </svg>
);

// ci:caret-down-md
export const CaretDownIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="m16 10l-4 4l-4-4"
    />
  </svg>
);