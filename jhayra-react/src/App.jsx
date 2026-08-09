import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppInner() {
  return (
    <>
      <ScrollToTop />
      <IntroAnimation />
      <Header />
      <main>
        <Routes>
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
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <AppInner />
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </HashRouter>
  );
}
