import type { SVGProps } from "react";

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const icon = (d: string) => (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d={d} />
  </svg>
);

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg {...base} width={22} height={22} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M8 3v18" />
    </svg>
  ),
  plus: icon("M12 5v14M5 12h14"),
  file: icon("M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5"),
  save: icon("M5 3h11l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 3v5h7V3M8 21v-7h8v7"),
  undo: icon("M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"),
  redo: icon("m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3"),
  layout: icon("M4 5h6v5H4zM14 5h6v5h-6zM9 14h6v5H9zM7 10v2h10v-2M12 12v2"),
  fit: icon("M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"),
  download: icon("M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"),
  sparkle: icon("M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"),
  trash: icon("M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"),
  copy: icon("M8 8h11v12H8zM5 16V4h11"),
  up: icon("m6 15 6-6 6 6"),
  down: icon("m6 9 6 6 6-6"),
};
