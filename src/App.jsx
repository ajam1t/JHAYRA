import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { CartProvider } from './state/cart';
import { AuthProvider, ShopProvider, ToastProvider } from './state/store';
import { FestivalProvider } from './state/festival';

const Shop = lazy(() => import('./pages/Shop'));
const Collections = lazy(() => import('./pages/Collections'));
const Product = lazy(() => import('./pages/Product'));
const Customize = lazy(() => import('./pages/Customize'));
const TemplateEditor = lazy(() => import('./pages/TemplateEditor'));
const PhotoBuilder = lazy(() => import('./pages/PhotoBuilder'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const GiftFinder = lazy(() => import('./pages/GiftFinder'));
const Inspiration = lazy(() => import('./pages/Inspiration'));
const WallPlanner = lazy(() => import('./pages/WallPlanner'));
const Info = lazy(() => import('./pages/Info'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Admin = lazy(() => import('./admin/Admin'));

function Loading() {
  return (
    <div className="page-loading" aria-label="Loading">
      <span />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ShopProvider>
          <CartProvider>
            <FestivalProvider>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/admin/*" element={<Admin />} />
                  <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="collections" element={<Collections />} />
                    <Route path="product/:id" element={<Product />} />
                    <Route path="product" element={<Navigate to="/shop" replace />} />
                    <Route path="customize" element={<Customize />} />
                    <Route path="customize/photo" element={<PhotoBuilder />} />
                    <Route path="customize/scratch" element={<TemplateEditor scratch />} />
                    <Route path="customize/:templateId" element={<TemplateEditor />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="gift-finder" element={<GiftFinder />} />
                    <Route path="room-inspiration" element={<Inspiration />} />
                    <Route path="wall-planner" element={<WallPlanner />} />
                    <Route path="stories" element={<Navigate to="/about" replace />} />
                    {['about', 'contact', 'support', 'corporate', 'privacy', 'refund', 'shipping-policy', 'terms', 'cookie-policy', 'replacement-policy'].map((p) => (
                      <Route key={p} path={p} element={<Info page={p} />} />
                    ))}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </FestivalProvider>
          </CartProvider>
        </ShopProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
