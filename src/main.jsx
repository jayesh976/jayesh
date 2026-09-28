import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Products from './pages/Products.jsx';
import Services from './pages/Services.jsx';
import Industries from './pages/Industries.jsx';
import HowWeWork from './pages/HowWeWork.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles.css';

const Admin = lazy(() => import('./pages/Admin.jsx'));

function AdminShell() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="wrap header-bar">
          <Link to="/" className="brand" aria-label="Back to website">
            <img src="/assets/logo-mark.png" alt="" width="50" height="44" />
            <span className="brand-text"><span className="sm">SHREE</span><span className="lg">MAHAGANPATI</span><span className="sm">ADMIN</span></span>
          </Link>
          <Link to="/" className="link">View website</Link>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Suspense fallback={<section className="admin"><p className="lead">Loading…</p></section>}><Admin /></Suspense>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminShell />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="founder" element={<Navigate to="/about#founder" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="services" element={<Services />} />
          <Route path="industries" element={<Industries />} />
          <Route path="how-we-work" element={<HowWeWork />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
