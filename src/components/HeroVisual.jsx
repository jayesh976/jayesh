import { useEffect, useRef } from 'react';

const PATHS = [
  [[0, .62], [.18, .62], [.26, .52], [.40, .52]],
  [[1, .40], [.82, .40], [.74, .50], [.60, .50]],
  [[.06, .2], [.22, .2], [.31, .3], [.39, .3]],
  [[.96, .84], [.8, .84], [.71, .7], [.61, .7]],
  [[.5, 1], [.5, .84], [.47, .75]],
];

const ringBase = { position: 'absolute', left: '50%', top: '49%', aspectRatio: '1', borderRadius: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' };

export default function HeroVisual() {
  const wrap = useRef(null), layer = useRef(null), cv = useRef(null);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = matchMedia('(max-width: 760px)').matches;
    const c = cv.current, ctx = c.getContext('2d');
    let W = 0, H = 0, raf = 0, mx = 0, my = 0, tx = 0, ty = 0, visible = true;
    const resize = () => {
      const r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; c.width = W * d; c.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const paths = PATHS.slice(0, mobile ? 4 : 5).map((p, i) => {
      let len = 0; const segs = [];
      for (let k = 1; k < p.length; k++) { const l = Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); segs.push(l); len += l; }
      return { p, segs, len, off: i * .27, speed: .09 + (i % 3) * .025 };
    });
    const at = (P, f) => {
      let d = Math.max(0, Math.min(1, f)) * P.len;
      for (let k = 0; k < P.segs.length; k++) {
        if (d <= P.segs[k] || k === P.segs.length - 1) {
          const t = P.segs[k] ? d / P.segs[k] : 0, a = P.p[k], b = P.p[k + 1];
          return [(a[0] + (b[0] - a[0]) * t) * W, (a[1] + (b[1] - a[1]) * t) * H];
        }
        d -= P.segs[k];
      }
    };
    const dust = Array.from({ length: mobile ? 26 : 60 }, () => ({ x: Math.random(), y: Math.random(), r: .7 + Math.random() * 1.8, vx: (Math.random() - .5) * .0005, vy: (Math.random() - .5) * .0005, a: .3 + Math.random() * .5, tw: Math.random() * 6.28 }));

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      for (const d of dust) {
        if (!reduce) { d.x = (d.x + d.vx * 16 + 1) % 1; d.y = (d.y + d.vy * 16 + 1) % 1; }
        const tw = reduce ? 1 : .6 + .4 * Math.sin(t / 700 + d.tw);
        ctx.fillStyle = `rgba(190,238,255,${(d.a * tw).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, 6.283); ctx.fill();
      }
      const L = Math.min(W, H) * .16;
      for (let i = 0; i < dust.length; i++) for (let j = i + 1; j < dust.length; j++) {
        const dx = (dust[i].x - dust[j].x) * W, dy = (dust[i].y - dust[j].y) * H, dd = Math.hypot(dx, dy);
        if (dd < L) {
          ctx.strokeStyle = `rgba(140,215,255,${(.28 * (1 - dd / L)).toFixed(3)})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(dust[i].x * W, dust[i].y * H); ctx.lineTo(dust[j].x * W, dust[j].y * H); ctx.stroke();
        }
      }
      if (reduce) return;
      const s = t / 1000;
      for (const P of paths) {
        const f = (s * P.speed + P.off) % 1.25;
        if (f > 1) continue;
        ctx.lineCap = 'round';
        for (let k = 0; k < 8; k++) {
          const a = at(P, f - k * .012), b = at(P, f - (k + 1) * .012);
          ctx.strokeStyle = `rgba(120,225,255,${.55 * (1 - k / 8)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
        const q = at(P, f);
        const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 9);
        g.addColorStop(0, 'rgba(230,250,255,.95)'); g.addColorStop(1, 'rgba(80,200,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, 6.283); ctx.fill();
      }
    };

    const box = wrap.current;
    const host = box.closest('section') || box;
    const onMove = (e) => { const r = box.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - .5) * -28; my = ((e.clientY - r.top) / r.height - .5) * -20; };
    const onLeave = () => { mx = 0; my = 0; };
    const allowParallax = !reduce && !mobile && matchMedia('(pointer: fine)').matches;
    if (allowParallax) { host.addEventListener('mousemove', onMove); host.addEventListener('mouseleave', onLeave); }

    // Pause the canvas loop while the hero is off-screen to save CPU/battery.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(box);

    const loop = (t) => {
      raf = 0;
      if (!visible) return;
      draw(t);
      if (allowParallax && layer.current) {
        tx += (mx - tx) * .05; ty += (my - ty) * .05;
        const r = box.getBoundingClientRect(); const sy = Math.max(-40, Math.min(40, -r.top * .12));
        layer.current.style.transform = `translate3d(${tx.toFixed(2)}px,${(ty + sy).toFixed(2)}px,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    if (reduce) draw(0); else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener('resize', resize);
      host.removeEventListener('mousemove', onMove); host.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrap} role="img" aria-label="Blue technology network visual representing connected industrial supply" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a2a7a' }}>
      <div ref={layer} style={{ position: 'absolute', inset: '-6%', willChange: 'transform' }}>
        <img src="/assets/industrial-technology-network-hero.jpeg" alt="" fetchpriority="high" className="hv-a"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'hvBreathe 28s ease-in-out infinite, hvHue 7s ease-in-out infinite', transformOrigin: '50% 49%' }} />
        <div className="hv-a" style={{ ...ringBase, width: '28%', background: 'radial-gradient(circle, rgba(180,240,255,.7) 0%, rgba(60,170,255,.25) 40%, rgba(60,170,255,0) 70%)', mixBlendMode: 'screen', animation: 'hvPulse 5.5s ease-in-out infinite' }} />
        <div className="hv-a" style={{ ...ringBase, width: '52%', border: '1px dashed rgba(170,230,255,.45)', animation: 'hvSpin 36s linear infinite' }} />
        <div className="hv-a" style={{ ...ringBase, width: '66%', border: '1px solid transparent', borderTopColor: 'rgba(120,220,255,.6)', borderRightColor: 'rgba(120,220,255,.25)', animation: 'hvSpinR 24s linear infinite' }} />
        <div style={{ ...ringBase, width: '80%', border: '1px solid rgba(170,230,255,.14)' }} />
        <canvas ref={cv} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        <div className="hv-a" style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '26%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(220,245,255,.16), rgba(255,255,255,0))', animation: 'hvSweep 8s ease-in-out 1s infinite', transform: 'translateX(-160%)', pointerEvents: 'none' }} />
        <div className="hv-a" style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '14%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(224,176,74,.14), rgba(255,255,255,0))', animation: 'hvSweep 11s ease-in-out 5s infinite', transform: 'translateX(-160%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
