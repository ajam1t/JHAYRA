import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import IntroAnimation from './components/IntroAnimation';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Collections from './pages/Collections';
import Product from './pages/Product';
import Customize from './pages/Customize';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import RoomInspiration from './pages/RoomInspiration';
import GiftFinder from './pages/GiftFinder';
import Corporate from './pages/Corporate';
import CustomerStories from './pages/CustomerStories';
import Support from './pages/Support';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import ShippingPolicy from './pages/ShippingPolicy';
import Terms from './pages/Terms';
import CookiePolicy from './pages/CookiePolicy';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Storefront layout — wraps all public pages with Header/Footer
function StorefrontLayout() {
  return (
    <>
      <IntroAnimation />
      <ScrollToTop />
      <Header />
      <BottomNav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JHAYRA',
  url: 'https://jhayra.com',
  logo: 'https://jhayra.com/Images/personalized.jpg',
  sameAs: ['https://www.instagram.com/jhayra.in/'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi'],
  },
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'JHAYRA',
  url: 'https://jhayra.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://jhayra.com/shop?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

function GlobalSchemas() {
  useEffect(() => {
    function injectSchema(id, data) {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    }
    injectSchema('org-schema', ORG_SCHEMA);
    injectSchema('website-schema', WEBSITE_SCHEMA);
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <GlobalSchemas />
              <Routes>
                {/* ── Admin ─────────────────────────────────────── */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/:id" element={<ProductForm />} />
                  <Route path="categories" element={<AdminCategories />} />
                </Route>

                {/* ── Storefront ────────────────────────────────── */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/product/:id" element={<Product />} />
                  <Route path="/product" element={<Product />} />
                  <Route path="/customize/:templateId" element={<Customize />} />
                  <Route path="/customize" element={<Customize />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/room-inspiration" element={<RoomInspiration />} />
                  <Route path="/gift-finder" element={<GiftFinder />} />
                  <Route path="/corporate" element={<Corporate />} />
                  <Route path="/stories" element={<CustomerStories />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
