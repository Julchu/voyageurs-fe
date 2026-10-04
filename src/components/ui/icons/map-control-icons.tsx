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
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={"1.5"}
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
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={"1.5"}
      d="m16 21l-4-8l-4 8l4-2zM10 9V3l4 6V3"
    />
  </svg>
);

export const PowerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
  </svg>
);

export const NoPowerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457L3 3m5.457 5.457l7.086 7.086m0 0L21 21"
    />
  </svg>
);

// tabler:moon-stars
export const NightIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
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
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={"1.5"}
        d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992zm5 1a2 2 0 0 0 2 2a2 2 0 0 0-2 2a2 2 0 0 0-2-2a2 2 0 0 0 2-2m2 7h2m-1-1v2"
      />
    </svg>
  );
};

// tabler:sunrise-filled
export const DawnIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="currentColor">
        <path d="M4 16a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2zm8-4a5 5 0 0 1 5 5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1a5 5 0 0 1 5-5m9 4a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2zM6.307 9.893l.7.7a1 1 0 0 1-1.414 1.414l-.7-.7a1 1 0 0 1 1.414-1.414m12.8 0a1 1 0 0 1 0 1.414l-.7.7a1 1 0 0 1-1.414-1.414l.7-.7a1 1 0 0 1 1.414 0m-6.4-7.6l3 3a1 1 0 1 1-1.414 1.414L13 5.415V9a1 1 0 0 1-.883.993L12 10a1 1 0 0 1-1-1V5.414L9.707 6.707a1 1 0 0 1-1.414-1.414l2.958-2.96a1 1 0 0 1 .15-.135l.127-.08l.068-.033l.11-.041l.12-.029c.3-.055.627.024.881.278M3 20h18a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2" />
        <path d="M12 12a5 5 0 0 1 4.583 7.002H7.417A5 5 0 0 1 12 12" />
      </g>
    </svg>
  );
};

// tabler: sun - filled;
export const DayIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 19a1 1 0 0 1 .993.883L13 20v1a1 1 0 0 1-1.993.117L11 21v-1a1 1 0 0 1 1-1m6.313-2.09l.094.083l.7.7a1 1 0 0 1-1.32 1.497l-.094-.083l-.7-.7a1 1 0 0 1 1.218-1.567zm-11.306.083a1 1 0 0 1 .083 1.32l-.083.094l-.7.7a1 1 0 0 1-1.497-1.32l.083-.094l.7-.7a1 1 0 0 1 1.414 0M4 11a1 1 0 0 1 .117 1.993L4 13H3a1 1 0 0 1-.117-1.993L3 11zm17 0a1 1 0 0 1 .117 1.993L21 13h-1a1 1 0 0 1-.117-1.993L20 11zM6.213 4.81l.094.083l.7.7a1 1 0 0 1-1.32 1.497l-.094-.083l-.7-.7A1 1 0 0 1 6.11 4.74zm12.894.083a1 1 0 0 1 .083 1.32l-.083.094l-.7.7a1 1 0 0 1-1.497-1.32l.083-.094l.7-.7a1 1 0 0 1 1.414 0M12 2a1 1 0 0 1 .993.883L13 3v1a1 1 0 0 1-1.993.117L11 4V3a1 1 0 0 1 1-1m0 5a5 5 0 1 1-4.995 5.217L7 12l.005-.217A5 5 0 0 1 12 7"
      />
    </svg>
  );
};

// tabler:sunset-filled
export const DuskIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M4 16a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2zm17 0a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2zM6.307 9.893l.7.7a1 1 0 0 1-1.414 1.414l-.7-.7a1 1 0 0 1 1.414-1.414m12.8 0a1 1 0 0 1 0 1.414l-.7.7a1 1 0 0 1-1.414-1.414l.7-.7a1 1 0 0 1 1.414 0M12 2a1 1 0 0 1 1 1v3.584l1.293-1.291a1 1 0 0 1 1.32-.083l.094.083a1 1 0 0 1 0 1.414l-3 3a.98.98 0 0 1-.767.293l-.124-.017l-.127-.032l-.104-.04l-.115-.063a1 1 0 0 1-.151-.114L8.293 6.707a1 1 0 0 1 1.414-1.414L11 6.585V3a1 1 0 0 1 1-1M3 20h18a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2m9-8a5 5 0 0 1 4.583 7.002H7.417A5 5 0 0 1 12 12"
      />
    </svg>
  );
};