// tabler:menu-deep
import { SVGProps } from "react";

export function TablerMenuDeep(props: SVGProps<SVGSVGElement>) {
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
        d="M4 6h16M7 12h13m-10 6h10"
      />
    </svg>
  );
}