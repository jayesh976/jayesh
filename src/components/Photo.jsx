import { unsplash } from '../data.js';

export default function Photo({ id, alt, ratio = '4/3', sizes = '(max-width: 900px) 100vw, 580px', widths = [700, 1200], caption, eager = false, style }) {
  const [small, large] = widths;
  const [rw, rh] = ratio.split('/').map(Number);
  return (
    <figure className="photo">
      <img
        src={unsplash(id, large)}
        srcSet={`${unsplash(id, small)} ${small}w, ${unsplash(id, large)} ${large}w`}
        sizes={sizes}
        alt={alt}
        width={large}
        height={Math.round((large * rh) / rw)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ aspectRatio: ratio, ...style }}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
