import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import StikcoinsScreen from './components/StikcoinsScreen';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Hybrid Router */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/shopkeeper" element={<ShopkeeperDashboard />} />
          
          {/* Legacy Double-Phone Emulator View fallback */}
          <Route path="/emulator" element={<StikcoinsScreen />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

