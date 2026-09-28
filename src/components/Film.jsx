import React, { useEffect, useRef, useState } from 'react';
import { unsplash } from '../data.js';

const h = React.createElement;
const DUR = 50;
const U = (id) => unsplash(id, 1600);
const IMG = {
  wh: U('photo-1586528116311-ad8dd3c8310d'), pal: U('photo-1587293852726-70cdb56c2866'), pack: U('photo-1566576721346-d4a3b4eaeb55'),
  metal: U('photo-1504917595217-d4dc5ebe6122'), plant: U('photo-1581091226825-a6a2a5aee158'), con: U('photo-1504307651254-35680f356dfd'),
  log: U('photo-1565793298595-6a879b1d9492'), port: U('photo-1494412574643-ff11b0a5c1c3'),
};
const FOUNDER = '/assets/founder-om-jagtap.webp';
const LINES = [
  [0.5, 'Every business depends on reliable materials to keep its operations moving.'],
  [5.6, 'At Shree Mahaganpati Enterprises, we work with businesses to understand their requirements, and provide practical industrial supply solutions.'],
  [14.6, 'From wooden pallets and packaging products, to industrial scrap, plastic raw materials, and cotton waste.'],
  [21.6, 'We also supply industrial stationery, and construction materials.'],
  [25.6, 'Our approach is simple. Understand the requirement. Provide the right solution. And build long-term business relationships.'],
  [34.2, 'Based in Shirur, Pune, we serve businesses all over India. We handle sourcing, vendor coordination and timely delivery, so you can focus on running your operations.'],
  [43.8, 'Shree Mahaganpati Enterprises.'],
  [46.2, 'Industrial Supplies and Business Solutions.'],
];
const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 207.65, 246.94]];

export default function Film() {
  const wrap = useRef(null);
  const [t, setT] = useState(0), [playing, setPlaying] = useState(false), [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false), [cc, setCc] = useState(true), [spokenLine, setSpoken] = useState('');
  const [fsOn, setFsOn] = useState(false), [pseudo, setPseudo] = useState(false);
  const R = useRef({ t: 0, raf: 0, spoken: {}, ac: null, master: null, oscs: [], chord: -1, voice: null, vol: 0.9, muted: false });

  const pickVoice = () => {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const male = /male|ravi|rishi|prabhat|hemant|daniel|george|ryan|arthur|guy|david|mark|james|thomas|oliver/i;
    return vs.find((v) => v.lang === 'en-IN' && male.test(v.name)) || vs.find((v) => v.lang === 'en-IN') || vs.find((v) => /en-GB/.test(v.lang) && male.test(v.name)) || vs.find((v) => /^en/.test(v.lang) && male.test(v.name)) || vs.find((v) => /^en/.test(v.lang)) || null;
  };
  const speak = (text) => {
    if (!window.speechSynthesis || R.current.muted) return;
    const r = R.current;
    if (!r.voice) r.voice = pickVoice();
    text.match(/[^.]+\.?/g).map((x) => x.trim()).filter(Boolean).forEach((p) => {
      const u = new SpeechSynthesisUtterance(p);
      if (r.voice) { u.voice = r.voice; u.lang = r.voice.lang; } else u.lang = 'en-IN';
      u.rate = 0.9; u.pitch = 0.92; u.volume = r.vol;
      u.onstart = () => setSpoken(p);
      u.onend = () => setSpoken((cur) => (cur === p ? '' : cur));
      u.onerror = () => setSpoken((cur) => (cur === p ? '' : cur));
      speechSynthesis.speak(u);
    });
  };
  const audioInit = () => {
    const r = R.current; if (r.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = new AC(), master = ac.createGain(); master.gain.value = (r.muted ? 0 : r.vol) * 0.5; master.connect(ac.destination);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4; lp.connect(master);
    r.oscs = CHORDS[0].map((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1) * 4; g.gain.value = i === 0 ? 0.09 : 0.045; o.connect(g); g.connect(lp); o.start(); return o; });
    const sub = ac.createOscillator(), sg = ac.createGain(); sub.type = 'sine'; sub.frequency.value = 55; sg.gain.value = 0.05; sub.connect(sg); sg.connect(master); sub.start(); r.sub = sub;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 250; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const ns = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain(); ns.buffer = nb; ns.loop = true; nf.type = 'lowpass'; nf.frequency.value = 320; ng.gain.value = 0.035; ns.connect(nf); nf.connect(ng); ng.connect(master); ns.start();
    r.ac = ac; r.master = master;
  };
  const setChord = (i) => { const r = R.current; if (!r.ac || r.chord === i) return; r.chord = i; const now = r.ac.currentTime; CHORDS[i].forEach((f, k) => r.oscs[k] && r.oscs[k].frequency.setTargetAtTime(f, now, 0.6)); if (r.sub) r.sub.frequency.setTargetAtTime(CHORDS[i][0] / 4, now, 0.6); };
  const fadeMaster = (to) => { const r = R.current; if (r.master) r.master.gain.setTargetAtTime(to, r.ac.currentTime, 0.25); };

  const stop = () => { const r = R.current; cancelAnimationFrame(r.raf); setPlaying(false); if (r.ac) r.ac.suspend(); };
  const loop = () => {
    const r = R.current; let last = performance.now();
    const tick = (now) => {
      r.t = Math.min(DUR, r.t + (now - last) / 1000); last = now;
      LINES.forEach(([st, txt], i) => { if (!r.spoken[i] && r.t >= st) { r.spoken[i] = true; if (r.t < st + 1.5) speak(txt); } });
      setChord(Math.floor(r.t / 5) % 4);
      const tail = DUR - r.t; if (tail < 3) fadeMaster((r.muted ? 0 : r.vol) * 0.5 * Math.max(0, tail / 3));
      setT(r.t);
      if (r.t >= DUR) { stop(); return; }
      r.raf = requestAnimationFrame(tick);
    };
    r.raf = requestAnimationFrame(tick);
  };
  const seek = (nt) => {
    const r = R.current; r.t = Math.max(0, Math.min(DUR - 0.01, nt)); setT(r.t);
    if (window.speechSynthesis) speechSynthesis.cancel();
    setSpoken('');
    r.spoken = {}; LINES.forEach(([st], i) => { if (st < r.t) r.spoken[i] = true; });
  };
  const play = () => {
    const r = R.current; setStarted(true); audioInit();
    if (r.t >= DUR - 0.05) seek(0);
    if (r.ac) { r.ac.resume(); fadeMaster((r.muted ? 0 : r.vol) * 0.5); }
    if (window.speechSynthesis && speechSynthesis.paused) speechSynthesis.resume();
    setPlaying(true); cancelAnimationFrame(r.raf); loop();
  };
  const pause = () => { if (window.speechSynthesis) speechSynthesis.pause(); stop(); };
  const toggle = () => (playing ? pause() : play());
  const skip = (d) => seek(R.current.t + d);
  const toggleMute = () => {
    const r = R.current, m = !r.muted; r.muted = m; setMuted(m);
    if (r.master) { r.master.gain.cancelScheduledValues(r.ac.currentTime); r.master.gain.setValueAtTime(m ? 0 : r.vol * 0.5, r.ac.currentTime); }
    if (m && window.speechSynthesis) { speechSynthesis.cancel(); setSpoken(''); }
  };
  const fs = () => {
    const el = wrap.current, d = document;
    if (pseudo) { setPseudo(false); return; }
    if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    const enabled = d.fullscreenEnabled || d.webkitFullscreenEnabled;
    if (!req || !enabled) { setPseudo(true); return; }
    try { const p = req.call(el); if (p && p.catch) p.catch(() => setPseudo(true)); } catch { setPseudo(true); }
  };

  useEffect(() => {
    const on = () => setFsOn(!!(document.fullscreenElement || document.webkitFullscreenElement));
    const key = (e) => { if (e.key === 'Escape') setPseudo(false); };
    document.addEventListener('fullscreenchange', on); document.addEventListener('webkitfullscreenchange', on); window.addEventListener('keydown', key);
    return () => { document.removeEventListener('fullscreenchange', on); document.removeEventListener('webkitfullscreenchange', on); window.removeEventListener('keydown', key); };
  }, []);
  useEffect(() => { document.documentElement.style.overflow = pseudo ? 'hidden' : ''; }, [pseudo]);
  useEffect(() => {
    if (window.speechSynthesis) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { R.current.voice = pickVoice(); }; }
    return () => {
      const r = R.current; cancelAnimationFrame(r.raf);
      if (window.speechSynthesis) { speechSynthesis.cancel(); speechSynthesis.onvoiceschanged = null; }
      if (r.ac) r.ac.close();
      document.documentElement.style.overflow = '';
    };
  }, []);
  useEffect(() => { if (started) Object.values(IMG).forEach((src) => { const i = new Image(); i.src = src; }); }, [started]);

  const full = fsOn || pseudo;
  const cl = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => 1 - Math.pow(1 - cl(x), 3);
  const vis = (a, b, f) => cl((t - a) / (f || 0.8)) * cl((b - t) / (f || 0.8));
  const photo = (src, a, b, s0, s1, x0, x1, pos) => {
    const o = vis(a, b), p = cl((t - a) / (b - a));
    if (o <= 0) return null;
    return h('div', { key: src + a, style: { position: 'absolute', inset: 0, opacity: o, backgroundImage: `url("${src}")`, backgroundSize: 'cover', backgroundPosition: pos || 'center', transform: `scale(${(s0 + (s1 - s0) * p).toFixed(4)}) translateX(${(x0 + (x1 - x0) * p).toFixed(3)}%)`, willChange: 'transform, opacity' } });
  };
  const txt = (a, b, style, children, dy, key) => {
    const o = vis(a, b, 0.6); if (o <= 0) return null;
    return h('div', { key, style: Object.assign({ position: 'absolute', opacity: o, transform: `translateY(${((1 - ease((t - a) / 0.9)) * (dy == null ? 2 : dy)).toFixed(3)}cqw)` }, style) }, children);
  };
  const eyebrow = { fontSize: '1.25cqw', fontWeight: 700, letterSpacing: '.22em', color: '#e0b04a' };
  const big = { fontSize: '4.2cqw', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-.02em', color: '#ffffff', textWrap: 'balance' };
  const shade = (a, b, dir) => { const o = vis(a, b); return o > 0 ? h('div', { style: { position: 'absolute', inset: 0, opacity: o, background: dir || 'linear-gradient(90deg,rgba(6,18,44,.85) 0%,rgba(6,18,44,.45) 55%,rgba(6,18,44,.1) 100%)' } }) : null; };
  const products = [['Wooden Pallets', IMG.pal, 14.5, 16.4], ['Packaging Products', IMG.pack, 16.4, 18.2], ['Industrial Scrap', IMG.metal, 18.2, 20], ['Plastic Raw Material', IMG.plant, 20, 21.8]];
  const steps = [['01', 'Understand the requirement', 26.4], ['02', 'Provide the right solution', 28.4], ['03', 'Build long-term relationships', 30.6]];
  const timed = LINES.slice().reverse().find(([st]) => t >= st && t < st + 7.5);
  const hasSpeech = typeof window !== 'undefined' && !!window.speechSynthesis && !muted;
  const capText = hasSpeech ? spokenLine : timed ? timed[1] : '';
  const bottomShade = 'linear-gradient(0deg,rgba(6,18,44,.88) 0%,rgba(6,18,44,.2) 55%,rgba(6,18,44,0) 100%)';

  const scene = h('div', { 'aria-hidden': true, style: { position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b1d3f', containerType: 'inline-size' } },
    photo(IMG.wh, 0, 5.8, 1.02, 1.14, 0, -2),
    shade(0, 5.8),
    txt(1, 5.4, { left: '6%', bottom: '30%', width: '62%', display: 'flex', flexDirection: 'column', gap: '1.2cqw' }, [h('span', { key: 1, style: eyebrow }, 'SHREE MAHAGANPATI ENTERPRISES'), h('span', { key: 2, style: big }, 'Reliable materials keep operations moving.')]),
    vis(5.5, 14.8) > 0 ? h('div', { style: { position: 'absolute', inset: 0, opacity: vis(5.5, 14.8), background: 'linear-gradient(100deg,#0b1d3f 0%,#0f2a5c 58%,#16376f 100%)' } },
      h('div', { style: { position: 'absolute', right: '6%', bottom: 0, height: '88%', aspectRatio: '3 / 4', background: '#ffffff', overflow: 'hidden', transform: `translateX(${((1 - ease((t - 5.5) / 1.4)) * 8).toFixed(2)}cqw) scale(${(1 + cl((t - 5.5) / 9.3) * 0.04).toFixed(4)})`, transformOrigin: '50% 100%', borderTop: '0.35cqw solid #c9962e' } },
        h('img', { src: FOUNDER, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' } }))) : null,
    txt(6.3, 14.4, { left: '6%', top: '20%', width: '48%', display: 'flex', flexDirection: 'column', gap: '1.4cqw' }, [h('span', { key: 1, style: eyebrow }, 'MEET THE FOUNDER'), h('span', { key: 2, style: { ...big, fontSize: '5.2cqw' } }, 'Om Jagtap'), h('span', { key: 3, style: { fontSize: '1.7cqw', lineHeight: 1.45, color: '#c5d3e6', fontWeight: 500 } }, 'Understanding each requirement and providing practical industrial supply solutions.')]),
    txt(8.2, 14.4, { left: '6%', bottom: '30%', display: 'flex', gap: '2cqw', fontSize: '1.3cqw', fontWeight: 600, color: '#ffffff' }, [h('span', { key: 1, style: { borderTop: '0.2cqw solid #e0b04a', paddingTop: '0.8cqw' } }, 'Shirur, Pune'), h('span', { key: 2, style: { borderTop: '0.2cqw solid #e0b04a', paddingTop: '0.8cqw' } }, 'Supplying across India')]),
    products.map(([, src, a, b], i) => photo(src, a, b + 0.4, 1.08, 1.0, i % 2 ? 2 : -2, 0)),
    shade(14.5, 22.2, bottomShade),
    products.map(([n, , a, b], i) => txt(a + 0.2, b + 0.3, { left: '6%', bottom: '30%', width: '80%', display: 'flex', flexDirection: 'column', gap: '0.8cqw' }, [h('span', { key: 1, style: eyebrow }, `${String(i + 1).padStart(2, '0')} / 10  INDUSTRIAL SUPPLIES`), h('span', { key: 2, style: big }, n)], 1.2, n)),
    photo(IMG.con, 21.6, 25.9, 1.12, 1.02, 0, 1.5),
    shade(21.6, 25.9, bottomShade),
    txt(21.9, 25.6, { left: '6%', bottom: '30%', width: '80%', display: 'flex', flexDirection: 'column', gap: '0.8cqw' }, [h('span', { key: 1, style: eyebrow }, 'ALSO SUPPLYING'), h('span', { key: 2, style: big }, 'Industrial Stationery · Construction Material')], 1.2),
    photo(IMG.log, 25.6, 34, 1.0, 1.1, 1, -1.5),
    shade(25.6, 34, 'linear-gradient(90deg,rgba(6,18,44,.9) 0%,rgba(6,18,44,.6) 60%,rgba(6,18,44,.35) 100%)'),
    txt(25.9, 33.6, { left: '6%', top: '14%', ...eyebrow }, 'OUR APPROACH'),
    steps.map(([no, label, a]) => txt(a, 33.6, { left: '6%', top: `${a === 26.4 ? 24 : a === 28.4 ? 39 : 54}%`, display: 'flex', alignItems: 'baseline', gap: '2cqw', width: '80%', borderTop: '0.2cqw solid rgba(255,255,255,.5)', paddingTop: '1.2cqw' }, [h('span', { key: 1, style: { fontSize: '2cqw', fontWeight: 800, color: '#e0b04a' } }, no), h('span', { key: 2, style: { ...big, fontSize: '3.4cqw' } }, label)], 1.4, no)),
    photo(IMG.port, 33.5, 44, 1.12, 1.0, -1.5, 1),
    shade(33.5, 44, 'linear-gradient(90deg,rgba(6,18,44,.9) 0%,rgba(6,18,44,.76) 60%,rgba(6,18,44,.68) 100%)'),
    txt(34.3, 43.4, { left: '6%', top: '16%', width: '70%', display: 'flex', flexDirection: 'column', gap: '1.2cqw' }, [h('span', { key: 1, style: eyebrow }, 'SHIRUR, PUNE  ·  ALL OVER INDIA'), h('span', { key: 2, style: big }, 'One partner, from sourcing to delivery.')]),
    [['Sourcing', 37], ['Vendor coordination', 38.4], ['Timely delivery', 39.8]].map(([label, a], i) => txt(a, 43.4, { left: `${6 + i * 29}%`, top: '56%', width: '26%', borderTop: '0.25cqw solid #e0b04a', paddingTop: '1.2cqw', display: 'flex', flexDirection: 'column', gap: '0.6cqw' }, [h('span', { key: 1, style: { fontSize: '1.5cqw', fontWeight: 800, color: '#e0b04a' } }, String(i + 1).padStart(2, '0')), h('span', { key: 2, style: { fontSize: '2.3cqw', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 } }, label)], 1.2, label)),
    vis(43.6, 60) > 0 ? h('div', { style: { position: 'absolute', inset: 0, opacity: vis(43.6, 60), background: '#ffffff' } }) : null,
    txt(44, 60, { left: '6%', top: '12%', width: '88%', display: 'flex', alignItems: 'center', gap: '3cqw' }, [
      h('img', { key: 1, src: '/assets/logo-mark.png', alt: '', style: { width: '15cqw', height: 'auto', display: 'block', transform: `scale(${(0.92 + ease((t - 44) / 1.5) * 0.08).toFixed(3)})` } }),
      h('div', { key: 2, style: { display: 'flex', flexDirection: 'column', gap: '0.8cqw', borderLeft: '0.3cqw solid #c9962e', paddingLeft: '3cqw' } },
        h('span', { style: { fontSize: '1.4cqw', fontWeight: 600, letterSpacing: '.34em', color: '#9a6f18' } }, 'SHREE'),
        h('span', { style: { fontSize: '5cqw', fontWeight: 800, letterSpacing: '.02em', lineHeight: 1, color: '#0f2a5c' } }, 'MAHAGANPATI'),
        h('span', { style: { fontSize: '1.4cqw', fontWeight: 600, letterSpacing: '.34em', color: '#9a6f18' } }, 'ENTERPRISES')),
    ], 1.5),
    txt(46.3, 60, { left: '6%', top: '58%', width: '88%', display: 'flex', flexDirection: 'column', gap: '0.8cqw', borderTop: '0.25cqw solid #0b1d3f', paddingTop: '1.6cqw' }, [h('span', { key: 1, style: { fontSize: '2.6cqw', fontWeight: 800, color: '#0b1d3f' } }, 'Industrial Supplies & Business Solutions'), h('span', { key: 2, style: { fontSize: '1.4cqw', fontWeight: 600, color: '#3d4f69' } }, 'Inspiring the Best Solution with Perfection  ·  +91 72492 17070')], 1),
  );

  const I = (d2, size) => h('svg', { width: size || 20, height: size || 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, [].concat(d2).map((p, k) => h('path', { key: k, d: p })));
  const fmt = (x) => { x = Math.max(0, Math.floor(x || 0)); return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; };
  const btn = { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#ffffff', border: 'none', cursor: 'pointer', padding: 0, flex: 'none' };
  const onDark = t < 43.6;
  const frame = full
    ? { position: 'relative', width: 'min(100vw, 177.78vh)', aspectRatio: '16 / 9', overflow: 'hidden', background: '#0b1d3f' }
    : { position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 6, overflow: 'hidden', background: '#0b1d3f', border: '1px solid #c3d3e6', boxShadow: '0 18px 44px rgba(11,29,63,.18)' };
  const outer = full
    ? { position: pseudo ? 'fixed' : 'relative', inset: 0, zIndex: 2147483000, width: pseudo ? '100vw' : '100%', height: pseudo ? '100vh' : '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : { width: '100%' };

  return (
    <div ref={wrap} style={outer}>
      <div style={frame}>
        {started && scene}
        {started && <div onClick={toggle} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />}
        {started && cc && capText && (
          <div aria-live="off" style={{ position: 'absolute', left: '50%', bottom: 66, transform: 'translateX(-50%)', maxWidth: '82%', padding: '6px 12px', background: onDark ? 'rgba(0,0,0,.55)' : 'rgba(11,29,63,.8)', color: '#ffffff', fontSize: 'clamp(11px,1.4vw,15px)', lineHeight: 1.4, textAlign: 'center', pointerEvents: 'none', borderRadius: 3 }}>{capText}</div>
        )}
        {!started && (
          <button type="button" onClick={play} aria-label="Watch the video" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', padding: 0, cursor: 'pointer', background: 'linear-gradient(100deg,#0b1d3f 0%,#0f2a5c 52%,#e9eef5 52.2%,#ffffff 100%)', display: 'block', textAlign: 'left', fontFamily: 'inherit' }}>
            <img src={FOUNDER} alt="" loading="lazy" style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: 'auto', maxWidth: '50%', objectFit: 'cover', objectPosition: 'top' }} />
            <span style={{ position: 'absolute', left: '6%', top: '10%', bottom: '10%', width: '44%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#ffffff' }}>
              <span style={{ fontSize: 'clamp(14px,2vw,24px)', fontWeight: 800, lineHeight: 1.1 }}>Shree Mahaganpati Enterprises</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 'clamp(52px,7vw,84px)', height: 'clamp(52px,7vw,84px)', borderRadius: '50%', background: '#e0b04a', color: '#0b1d3f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.3)', flex: 'none' }}>
                  <svg width="38%" height="38%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: '8%' }}><path d="M6 4l14 8-14 8z" /></svg>
                </span>
                <span style={{ fontSize: 'clamp(11px,1.3vw,15px)', fontWeight: 600 }}>Watch the video</span>
              </span>
            </span>
          </button>
        )}
        {started && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 10px 6px', background: 'linear-gradient(180deg,rgba(0,0,0,0),rgba(6,16,36,.85))', display: 'flex', flexDirection: 'column', gap: 2, color: '#ffffff' }}>
            <input type="range" min={0} max={1000} value={Math.round((t / DUR) * 1000)} onChange={(e) => seek((+e.target.value / 1000) * DUR)} aria-label="Seek" style={{ width: '100%', accentColor: '#e0b04a', margin: 0, cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button type="button" style={btn} onClick={() => skip(-10)} aria-label="Back 10 seconds">{I(['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'])}</button>
              <button type="button" style={btn} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? I(['M8 5v14', 'M16 5v14'], 22) : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l14 8-14 8z" /></svg>}
              </button>
              <button type="button" style={btn} onClick={() => skip(10)} aria-label="Forward 10 seconds">{I(['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', 'M21 3v5h-5'])}</button>
              <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', padding: '0 8px', whiteSpace: 'nowrap' }}>{fmt(t)} / {fmt(DUR)}</span>
              <span style={{ flex: 1 }} />
              <button type="button" style={{ ...btn, width: 'auto', padding: '0 8px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', opacity: cc ? 1 : 0.55 }} onClick={() => setCc(!cc)} aria-label="Captions" aria-pressed={cc}>CC</button>
              <button type="button" style={btn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
                {I(muted ? ['M11 5 6 9H2v6h4l5 4z', 'm22 9-6 6', 'm16 9 6 6'] : ['M11 5 6 9H2v6h4l5 4z', 'M15.54 8.46a5 5 0 0 1 0 7.07', 'M19.07 4.93a10 10 0 0 1 0 14.14'])}
              </button>
              <button type="button" style={btn} onClick={fs} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}>
                {full ? I(['M8 3v3a2 2 0 0 1-2 2H3', 'M21 8h-3a2 2 0 0 1-2-2V3', 'M3 16h3a2 2 0 0 1 2 2v3', 'M16 21v-3a2 2 0 0 1 2-2h3']) : I(['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'])}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
