import type { ReactNode, SVGProps } from "react";

// TODO: swap these hand-drawn stand-ins for the official icons (lucide names noted per icon).
const strokeIcon = (children: ReactNode) => {
  const Icon = (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
  return Icon;
};

// lucide:calendar
export const CalendarIcon = strokeIcon(
  <>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>,
);

// tabler:calendar-check
export const CalendarCheckIcon = strokeIcon(
  <path d="M11.5 21H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M16 3v4M8 3v4m-4 4h16m-5 8l2 2l4-4" />,
);

// lucide:copy
export const CopyIcon = strokeIcon(
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" />
    <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
  </>,
);

// lucide:clock
export const ClockIcon = strokeIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>,
);

// lucide:arrow-left
export const ArrowLeftIcon = strokeIcon(<path d="m12 19-7-7 7-7M19 12H5" />);

// lucide:info
export const InfoIcon = strokeIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </>,
);

// lucide:map-pin
export const PinIcon = strokeIcon(
  <>
    <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </>,
);

// lucide:trash-2
export const TrashIcon = strokeIcon(
  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
);

// lucide:check
export const CheckIcon = strokeIcon(<path d="M20 6 9 17l-5-5" />);

// lucide:link
export const LinkIcon = strokeIcon(
  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
);

// lucide:cloud-check
export const CloudCheckIcon = strokeIcon(
  <path d="m17 15-5.5 5.5L9 18M5 17.743A7 7 0 1 1 15.71 10h1.79a4.5 4.5 0 0 1 1.5 8.742" />,
);
