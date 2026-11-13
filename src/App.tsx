import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Auth pages are small and needed immediately — keep eager
import { LoginPage }    from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

// All other pages are lazy-loaded — each lands in its own chunk.
// Heavy deps (xlsx, recharts, firebase/messaging) only load when their
// route is first visited, not on initial app boot.
const DashboardPage         = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrderListPage         = lazy(() => import('./features/orders/OrderListPage').then(m => ({ default: m.OrderListPage })));
const PrintOrdersPage       = lazy(() => import('./features/print-orders/PrintOrdersPage').then(m => ({ default: m.PrintOrdersPage })));
const RestaurantListPage    = lazy(() => import('./features/food/RestaurantListPage').then(m => ({ default: m.RestaurantListPage })));
const FoodOrdersPage        = lazy(() => import('./features/food/FoodOrdersPage').then(m => ({ default: m.FoodOrdersPage })));
const RestaurantMenuPage    = lazy(() => import('./features/food/RestaurantMenuPage').then(m => ({ default: m.RestaurantMenuPage })));
const ProductListPage       = lazy(() => import('./features/catalog/ProductListPage').then(m => ({ default: m.ProductListPage })));
const CategoryListPage      = lazy(() => import('./features/catalog/CategoryListPage').then(m => ({ default: m.CategoryListPage })));
const BannerListPage        = lazy(() => import('./features/banners/BannerListPage').then(m => ({ default: m.BannerListPage })));
const CouponListPage        = lazy(() => import('./features/coupons/CouponListPage').then(m => ({ default: m.CouponListPage })));
const CustomerListPage      = lazy(() => import('./features/customers/CustomerListPage').then(m => ({ default: m.CustomerListPage })));
const RiderListPage         = lazy(() => import('./features/riders/RiderListPage').then(m => ({ default: m.RiderListPage })));
const DarkStoreListPage     = lazy(() => import('./features/dark-stores/DarkStoreListPage').then(m => ({ default: m.DarkStoreListPage })));
const DarkStoreDetailPage   = lazy(() => import('./features/dark-stores/DarkStoreDetailPage').then(m => ({ default: m.DarkStoreDetailPage })));
const InventoryPage         = lazy(() => import('./features/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const PaymentListPage       = lazy(() => import('./features/payments/PaymentListPage').then(m => ({ default: m.PaymentListPage })));
const NotificationComposer  = lazy(() => import('./features/notifications/NotificationComposer').then(m => ({ default: m.NotificationComposer })));
const ReportsPage           = lazy(() => import('./features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const AdminUserListPage     = lazy(() => import('./features/admin-users/AdminUserListPage').then(m => ({ default: m.AdminUserListPage })));
const SettingsPage          = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage           = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ReferralPage          = lazy(() => import('./features/referrals/ReferralPage').then(m => ({ default: m.ReferralPage })));
const WalletPage            = lazy(() => import('./features/wallet/WalletPage').then(m => ({ default: m.WalletPage })));
const SupportPage           = lazy(() => import('./features/support/SupportPage').then(m => ({ default: m.SupportPage })));
const FaqListPage           = lazy(() => import('./features/faqs/FaqListPage').then(m => ({ default: m.FaqListPage })));
const InfoPagesPage         = lazy(() => import('./features/info-pages/InfoPagesPage'));
const GeoMastersPage        = lazy(() => import('./features/geo/GeoMastersPage'));
const LiveTrackingPage      = lazy(() => import('./features/tracking/LiveTrackingPage').then(m => ({ default: m.LiveTrackingPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-6 h-6 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />

                <Route element={<ProtectedRoute permission="orders.view" />}>
                  <Route path="orders"       element={<OrderListPage />} />
                  <Route path="print-orders" element={<PrintOrdersPage />} />
                  <Route path="food/orders"  element={<FoodOrdersPage />} />
                  <Route path="tracking"     element={<LiveTrackingPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="catalog.view" />}>
                  <Route path="catalog/categories" element={<CategoryListPage />} />
                  <Route path="catalog/fresh"      element={<CategoryListPage key="fresh" section="fresh" />} />
                  <Route path="catalog/products"   element={<ProductListPage />} />
                  <Route path="catalog/inventory"  element={<InventoryPage />} />
                  <Route path="food/restaurants"     element={<RestaurantListPage />} />
                  <Route path="food/restaurants/:id" element={<RestaurantMenuPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="banners.view" />}>
                  <Route path="banners"    element={<BannerListPage />} />
                  <Route path="faqs"       element={<FaqListPage />} />
                  <Route path="info-pages" element={<InfoPagesPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="coupons.view" />}>
                  <Route path="coupons" element={<CouponListPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="referrals.view" />}>
                  <Route path="referrals" element={<ReferralPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="customers.view" />}>
                  <Route path="customers" element={<CustomerListPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="riders.view" />}>
                  <Route path="riders" element={<RiderListPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="dark_stores.view" />}>
                  <Route path="dark-stores"     element={<DarkStoreListPage />} />
                  <Route path="dark-stores/:id" element={<DarkStoreDetailPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="dark_stores.view" />}>
                  <Route path="geo-masters" element={<GeoMastersPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="payments.view" />}>
                  <Route path="payments" element={<PaymentListPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="wallet.view" />}>
                  <Route path="wallet" element={<WalletPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="support.view" />}>
                  <Route path="support" element={<SupportPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="notifications.view" />}>
                  <Route path="notifications" element={<NotificationComposer />} />
                </Route>

                <Route element={<ProtectedRoute permission="reports.view" />}>
                  <Route path="reports" element={<ReportsPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="admin_users.view" />}>
                  <Route path="admin-users" element={<AdminUserListPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="settings.view" />}>
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="profile"           element={<ProfilePage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
