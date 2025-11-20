import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './controllers/CartContext';
import { AuthProvider, useAuth } from './controllers/AuthContext';
import { Navbar } from './views/Navbar';
import { Footer } from './views/Footer';
import { LandingPage } from './views/LandingPage';
import { Menu } from './views/Menu';
import { Cart } from './views/Cart';
import { Checkout } from './views/Checkout';
import { OrderConfirmation } from './views/OrderConfirmation';
import { VendorLogin } from './views/VendorLogin';
import { AdminPanelNew } from './views/AdminPanelNew';
import { UsuariosAdmin } from './views/UsuariosAdmin';
import { RolesAdmin } from './views/RolesAdmin';
import Profile from './views/Profile';
import { Toaster } from './views/ui/sonner';
import { Toaster as HotToaster } from 'react-hot-toast';

// Componente para proteger rutas que requieren autenticación
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Mientras está cargando, mostrar pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/vendor/login" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col overflow-x-hidden max-w-full">
        <Navbar />
        <main className="flex-1 overflow-x-hidden max-w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/menu" element={<Menu />} />
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor/panel" 
              element={
                <ProtectedRoute>
                  <AdminPanelNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor/roles" 
              element={
                <ProtectedRoute>
                  <RolesAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor/usuarios" 
              element={
                <ProtectedRoute>
                  <UsuariosAdmin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
        <HotToaster position="top-right" />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
