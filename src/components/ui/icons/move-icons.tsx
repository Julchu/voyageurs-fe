// tabler: arrow - move - down;
import { SVGProps } from "react";

export const MoveDownArrow = (props: SVGProps<SVGSVGElement>) => (
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
      strokeWidth="1.5"
      d="M12 11v10m-3-3l3 3l3-3M10 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0"
    />
  </svg>
);

// tabler:arrow-move-up
export const MoveUpArrow = (props: SVGProps<SVGSVGElement>) => (
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
      strokeWidth="1.5"
      d="M12 13V3M9 6l3-3l3 3m-3 11a2 2 0 1 1 0 4a2 2 0 0 1 0-4"
    />
  </svg>
);