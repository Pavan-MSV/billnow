import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { SplashPage } from './pages/SplashPage';
import { AddProductPage } from './pages/AddProductPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { EditProductPage } from './pages/EditProductPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { TermsPage } from './pages/TermsPage';

/** Root router component for BillNow Mobile-First App. */
export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        {/* 3. Opening Splash Screen is the first screen when user opens BillNow */}
        <Route path="/" element={<SplashPage />} />
        <Route path="/splash" element={<SplashPage />} />

        {/* Optional marketing landing page */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Public legal & compliance pages */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />

        {/* 4. Public authentication screens */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Password recovery */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 5. Main Authenticated Application with Mobile Bottom Navigation */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* 🏠 Home: Dashboard and products summary */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* 📦 Products: Complete product list & details */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/add" element={<AddProductPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={<EditProductPage />} />
            
            {/* 🔔 Alerts: Warranty and service notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/alerts" element={<Navigate to="/notifications" replace />} />
            
            {/* 👤 Account: User profile & application settings */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/account" element={<Navigate to="/settings" replace />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
