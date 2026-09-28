import { INDUSTRIES, unsplash } from '../data.js';
import { usePageMeta } from '../lib/seo.js';

export default function Industries() {
  usePageMeta({
    title: 'Industries We Supply | Shree Mahaganpati Enterprises',
    description: 'Industrial supplies for engineering and manufacturing, automotive, construction and infrastructure, energy and utilities, and commercial businesses across India.',
    path: '/industries',
    crumb: 'Industries',
  });

  return (
    <>
      <section data-screen-label="Industries — Intro" className="bb2">
        <div className="wrap pad-intro stack g20">
          <p className="eyebrow">Industries</p>
          <h1 className="h1">Industries we supply</h1>
          <p className="lead-lg">From Pune's manufacturing belt to project sites across India, our supply categories support these sectors.</p>
        </div>
      </section>

      <section>
        <div className="wrap pad-list">
          {INDUSTRIES.map((ind) => (
            <article key={ind.no} className="industry">
              <div className="stack g14">
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{ind.no}</span>
                <h2>{ind.name}</h2>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: 'var(--muted)' }}>{ind.desc}</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}><span style={{ fontWeight: 700 }}>Relevant supplies: </span>{ind.supplies}</p>
              </div>
              {ind.img && (
                <figure style={{ margin: 0 }}>
                  <img src={unsplash(ind.img, 1000)} srcSet={`${unsplash(ind.img, 600)} 600w, ${unsplash(ind.img, 1000)} 1000w`} sizes="(max-width: 900px) 100vw, 580px"
                    alt={ind.alt} width="1000" height="563" loading="lazy" decoding="async" className="img" style={{ objectFit: 'cover', display: 'block', height: 'auto' }} />
                </figure>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
