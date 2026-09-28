const Svg = ({ size = 16, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const Arrow = ({ size = 16 }) => (
  <Svg size={size}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>
);
export const Check = () => (
  <Svg size={18} stroke="#0f2a5c" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></Svg>
);
export const Chat = ({ size = 20 }) => (
  <Svg size={size}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Svg>
);
export const Mail = ({ size = 16 }) => (
  <Svg size={size}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></Svg>
);
export const Phone = ({ size = 16 }) => (
  <Svg size={size}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>
);
export const MenuIcon = ({ open }) => (
  <Svg size={24}>{open ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}</Svg>
);
