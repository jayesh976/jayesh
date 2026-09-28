import { Link } from 'react-router-dom';
import { Arrow } from '../components/Icons.jsx';
import { usePageMeta } from '../lib/seo.js';

export default function NotFound() {
  usePageMeta({
    title: 'Page not found | Shree Mahaganpati Enterprises',
    description: 'The page you are looking for could not be found.',
    path: '/404',
    noindex: true,
  });
  return (
    <section className="bb2">
      <div className="wrap pad stack g20">
        <p className="eyebrow">404</p>
        <h1 className="h1">This page could not be found</h1>
        <p className="lead-lg">The link may be old or mistyped. Use the menu above, or go back to the home page.</p>
        <div><Link to="/" className="btn btn-primary">Go to home page<Arrow size={18} /></Link></div>
      </div>
    </section>
  );
}
