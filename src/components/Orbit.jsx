import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const ICONS = [
  ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M12 12m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0'],
  ['M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'],
  ['M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z', 'M12 22V12', 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7', 'm7.5 4.27 9 5.15'],
  ['M6 9V5h5v4', 'M13 9V4h5v5', 'M3 9h18', 'M3 14h18', 'M3 19h18', 'M5 14v5', 'M12 14v5', 'M19 14v5'],
  ['M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5', 'M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12', 'm14 16-3 3 3 3', 'M8.293 13.596 7.196 9.5 3.1 10.598', 'm9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843', 'm13.378 9.633 4.096 1.098 1.097-4.096'],
  ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'],
  ['M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2', 'M8.5 2h7', 'M7 16h10'],
  ['M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M12 11h4', 'M12 16h4', 'M8 11h.01', 'M8 16h.01'],
  ['M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5', 'M14 6a6 6 0 0 1 6 6v3', 'M4 15v-3a6 6 0 0 1 6-6', 'M3 15h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z'],
  ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
];

export default function Orbit({ items, onOpen }) {
  const box = useRef(null), ring = useRef(null), labels = useRef([]);
  const st = useRef({ a: 0, paused: false }), geo = useRef({});
  const [W, setW] = useState(640), [hover, setHover] = useState(-1);
  const n = items.length, step = (Math.PI * 2) / n;
  const S = Math.min(W, 660), mobile = S < 520, c = S / 2;
  const Ro = c - 2, Ri = Ro * (mobile ? 0.36 : 0.4), rm = (Ro + Ri) / 2 + (mobile ? 2 : 4);
  geo.current = { c, rm };

  const P = (r, t) => (c + r * Math.sin(t)).toFixed(2) + ' ' + (c - r * Math.cos(t)).toFixed(2);
  const seg = (i) => {
    const t0 = i * step - step / 2, t1 = i * step + step / 2;
    return `M${P(Ro, t0)} A${Ro} ${Ro} 0 0 1 ${P(Ro, t1)} L${P(Ri, t1)} A${Ri} ${Ri} 0 0 0 ${P(Ri, t0)} Z`;
  };
  const place = () => {
    const g = geo.current, A = st.current.a;
    if (ring.current) ring.current.setAttribute('transform', `rotate(${((A * 180) / Math.PI).toFixed(3)} ${g.c} ${g.c})`);
    for (let i = 0; i < n; i++) {
      const el = labels.current[i]; if (!el) continue;
      const t = A + i * step;
      el.style.transform = `translate3d(${(g.c + g.rm * Math.sin(t)).toFixed(2)}px,${(g.c - g.rm * Math.cos(t)).toFixed(2)}px,0) translate(-50%,-50%)`;
    }
  };

  useEffect(() => {
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(box.current);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = performance.now(), v = 1;
    const tick = (t) => {
      const dt = Math.min(50, t - last); last = t;
      v += ((st.current.paused ? 0 : 1) - v) * Math.min(1, dt / 220);
      if (!reduce) st.current.a += dt * v * ((Math.PI * 2) / 60000);
      place();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  useLayoutEffect(place, [W]);

  const enter = (i) => { st.current.paused = true; setHover(i); };
  const leave = () => { st.current.paused = false; setHover(-1); };
  const lw = mobile ? 70 : 118;

  return (
    <div ref={box} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div role="group" aria-label="Product categories wheel" style={{ position: 'relative', width: S, height: S, userSelect: 'none', filter: 'drop-shadow(0 18px 40px rgba(11,29,63,.14))' }}>
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g ref={ring}>
            {items.map((it, i) => {
              const on = i === hover;
              return (
                <path key={it.slug} d={seg(i)} role="link" tabIndex={0} aria-label={`${it.name} — view category`}
                  fill={on ? '#0f2a5c' : i % 2 ? '#f4f7fb' : '#ffffff'} stroke={on ? '#c9962e' : '#c3d3e6'} strokeWidth={on ? 2.5 : 1.5} strokeLinejoin="round"
                  style={{ cursor: 'pointer', transition: 'fill .3s ease, stroke .3s ease', outline: 'none' }}
                  onMouseEnter={() => enter(i)} onMouseLeave={leave} onFocus={() => enter(i)} onBlur={leave}
                  onClick={() => onOpen(it.slug)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(it.slug); } }} />
              );
            })}
          </g>
          <circle cx={c} cy={c} r={Ro} fill="none" stroke="#0b1d3f" strokeWidth="2" style={{ pointerEvents: 'none' }} />
          <circle cx={c} cy={c} r={Ri} fill="#ffffff" stroke="#0b1d3f" strokeWidth="2" />
        </svg>
        {items.map((it, i) => {
          const on = i === hover;
          return (
            <div key={it.slug} ref={(el) => (labels.current[i] = el)} aria-hidden="true"
              style={{ position: 'absolute', left: 0, top: 0, width: lw, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 3 : 6, textAlign: 'center', pointerEvents: 'none', willChange: 'transform', color: on ? '#ffffff' : '#0b1d3f', transition: 'color .3s ease' }}>
              <svg width={mobile ? 18 : 28} height={mobile ? 18 : 28} viewBox="0 0 24 24" fill="none" stroke={on ? '#e0b04a' : '#0f2a5c'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                {ICONS[i % ICONS.length].map((d, k) => <path key={k} d={d} />)}
              </svg>
              <span style={{ fontSize: mobile ? 9 : 13, fontWeight: 700, lineHeight: 1.15, textWrap: 'balance' }}>{it.name}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: c - Ri, top: c - Ri, width: Ri * 2, height: Ri * 2, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: mobile ? 2 : 6, pointerEvents: 'none', textAlign: 'center', padding: mobile ? 8 : 16 }}>
          <img src="/assets/logo-mark.png" alt="Shree Mahaganpati Enterprises" width="240" height="216" style={{ width: Ri * (mobile ? 1.05 : 0.95), height: 'auto', display: 'block' }} />
          {!mobile && (
            <span aria-live="polite" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', color: '#9a6f18', minHeight: 15, lineHeight: 1.2 }}>
              {hover >= 0 ? items[hover].name : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
