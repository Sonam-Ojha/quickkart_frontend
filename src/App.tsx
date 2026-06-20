import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';

import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OrderListPage } from './features/orders/OrderListPage';
import { ProductListPage } from './features/catalog/ProductListPage';
import { CategoryListPage } from './features/catalog/CategoryListPage';
import { BannerListPage } from './features/banners/BannerListPage';
import { CouponListPage } from './features/coupons/CouponListPage';
import { CustomerListPage } from './features/customers/CustomerListPage';
import { RiderListPage } from './features/riders/RiderListPage';
import { DarkStoreListPage } from './features/dark-stores/DarkStoreListPage';
import { DarkStoreDetailPage } from './features/dark-stores/DarkStoreDetailPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { PaymentListPage } from './features/payments/PaymentListPage';
import { NotificationComposer } from './features/notifications/NotificationComposer';
import { ReportsPage } from './features/reports/ReportsPage';
import { AdminUserListPage } from './features/admin-users/AdminUserListPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { ReferralPage } from './features/referrals/ReferralPage';
import { WalletPage } from './features/wallet/WalletPage';
import { SupportPage } from './features/support/SupportPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />

              <Route element={<ProtectedRoute permission="orders.view" />}>
                <Route path="orders" element={<OrderListPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="catalog.view" />}>
                <Route path="catalog/categories" element={<CategoryListPage />} />
                <Route path="catalog/products" element={<ProductListPage />} />
                <Route path="catalog/inventory" element={<InventoryPage />} />
              </Route>

              <Route element={<ProtectedRoute permission="banners.view" />}>
                <Route path="banners" element={<BannerListPage />} />
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
                <Route path="dark-stores" element={<DarkStoreListPage />} />
                <Route path="dark-stores/:id" element={<DarkStoreDetailPage />} />
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

              <Route path="profile" element={<ProfilePage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
