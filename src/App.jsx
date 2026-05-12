import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Portfolio from './pages/Portfolio.jsx';
import Schedule from './pages/Schedule.jsx';
import Gallery from './pages/Gallery.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Logs from './pages/Logs.jsx';
import AdminContent from './pages/AdminContent.jsx';
import AdminExperience from './pages/AdminExperience.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminGallery from './pages/AdminGallery.jsx';
import AdminSocials from './pages/AdminSocials.jsx';

function ProtectedRoute({ children }) {
  if (sessionStorage.getItem('rk_admin_auth') !== 'true') {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname, hash]);
  return null;
}

function PageWrap({ children }) {
  const location = useLocation();
  return <div key={location.pathname} className="page-enter">{children}</div>;
}

export default function App() {
  return (
    <>
      <CustomCursor />
      <ScrollToTop />
      <PageWrap>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute><AdminContent /></ProtectedRoute>} />
          <Route path="/admin/experience" element={<ProtectedRoute><AdminExperience /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/gallery" element={<ProtectedRoute><AdminGallery /></ProtectedRoute>} />
          <Route path="/admin/socials" element={<ProtectedRoute><AdminSocials /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrap>
    </>
  );
}
