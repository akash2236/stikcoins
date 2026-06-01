import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SHOPS } from '../data/appData';
import { playSound } from '../utils/soundEffects';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }) => {
  // Auth state (managed locally on client session)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('stikbook_user');
    return saved ? JSON.parse(saved) : null;
  });

  // central simulation states (synchronized with Express Backend)
  const [balance, setBalance] = useState(590);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [shopOrders, setShopOrders] = useState([]);

  // GPS (browser-level concerns, managed on client)
  const [userCoords, setUserCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [useRealGPS, setUseRealGPS] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  // Sound settings
  const [muted, setMuted] = useState(false);

  const sfx = useCallback((type) => {
    playSound(type, muted);
  }, [muted]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Fetch central simulation state from Express backend
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setDailyClaimed(data.dailyClaimed);
        setTransactions(data.transactions);
        setPendingOrder(data.pendingOrder);
        setShopOrders(data.shopOrders);
        
        // Dynamic balance sync for current active customer session
        setCurrentUser(prev => {
          if (prev && prev.role === 'customer' && prev.balance !== data.balance) {
            const updated = { ...prev, balance: data.balance };
            sessionStorage.setItem('stikbook_user', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Backend server offline or unreachable. Polling state ignored.', err);
    }
  }, []);

  // Poll server state every 2 seconds for high-end real-time dashboard sync
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // ─────────────────────────────────────────────────────
  // AUTH (Calls Backend /api/auth/login)
  // ─────────────────────────────────────────────────────
  const login = async (role, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        sessionStorage.setItem('stikbook_user', JSON.stringify(data.user));
        sfx('success');
        await fetchState();
        return { ok: true };
      } else {
        const data = await res.json();
        sfx('error');
        return { ok: false, error: data.error || 'Authentication failed' };
      }
    } catch (err) {
      console.error(err);
      sfx('error');
      return { ok: false, error: 'Cannot connect to backend server. Make sure the backend is running!' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('stikbook_user');
    sfx('scan');
  };

  // ─────────────────────────────────────────────────────
  // CUSTOMER — Claim daily check-in (Calls Backend)
  // ─────────────────────────────────────────────────────
  const claimDailyReward = async () => {
    try {
      const res = await fetch('/api/claim-daily', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.state.balance);
        setDailyClaimed(data.state.dailyClaimed);
        setTransactions(data.state.transactions);
        sfx('coin');
        showToast('🎁 +10 Stikcoins claimed successfully!', 'success');
      } else {
        const data = await res.json();
        showToast(`❌ ${data.error || 'Could not claim daily reward.'}`, 'error');
      }
    } catch (err) {
      showToast('❌ Backend server unreachable.', 'error');
    }
  };

  // ─────────────────────────────────────────────────────
  // CUSTOMER — Place dynamic redemption order (Calls Backend)
  // ─────────────────────────────────────────────────────
  const placeOrder = async (shop, product, toEmail) => {
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          productId: product.id,
          toEmail
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPendingOrder(data.order);
        setBalance(data.state.balance);
        sfx('success');
        showToast(`⏳ Secure OTP generated for ${product.name}!`, 'success');
        
        if (toEmail) {
          if (data.emailSent) {
            showToast(`🎉 OTP successfully sent to ${toEmail}! Check your inbox.`, 'success');
          } else {
            showToast(`✉️ Failed to send email to ${toEmail}.`, 'error');
          }
        }
        await fetchState();
        return data.order;
      } else {
        const err = await res.json();
        sfx('error');
        showToast(`❌ ${err.error || 'Order placement failed'}`, 'error');
      }
    } catch (err) {
      showToast('❌ Backend server unreachable.', 'error');
    }
  };

  const cancelOrder = async () => {
    try {
      const res = await fetch('/api/orders/cancel', { method: 'POST' });
      if (res.ok) {
        setPendingOrder(null);
        sfx('scan');
        await fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────
  // CUSTOMER — Trigger manual OTP email dispatch from backend
  // ─────────────────────────────────────────────────────
  const dispatchOTPEmailBackend = async (email) => {
    try {
      const res = await fetch('/api/orders/email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        const data = await res.json();
        await fetchState();
        return { success: data.success, error: data.error };
      }
      return { success: false, error: 'HTTP failed' };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // ─────────────────────────────────────────────────────
  // SHOPKEEPER — Verify Scanned Code / Manual OTP (Calls Backend)
  // ─────────────────────────────────────────────────────
  const approveOrder = async (otp, bypassVerification = false) => {
    try {
      const res = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, bypassVerification })
      });

      if (res.ok) {
        const data = await res.json();
        setPendingOrder(null);
        setBalance(data.state.balance);
        sfx('coin');
        showToast(`✅ Order approved! Coins deducted.`, 'success');
        
        if (data.emailSent) {
          showToast(`🎉 Transaction email delivered to customer!`, 'success');
        } else {
          showToast(`✉️ Email receipt failed to send.`, 'error');
        }
        await fetchState();
        return { success: true };
      } else {
        const err = await res.json();
        sfx('error');
        showToast(`❌ ${err.error || 'Verification failed'}`, 'error');
        return { success: false, error: err.error || 'Verification failed' };
      }
    } catch (err) {
      showToast('❌ Backend server unreachable.', 'error');
      return { success: false, error: 'Server unreachable.' };
    }
  };

  // ─────────────────────────────────────────────────────
  // GPS DRIFT (Managed locally on Client browser)
  // ─────────────────────────────────────────────────────
  const driftGPS = () => {
    let steps = 0;
    const interval = setInterval(() => {
      setUserCoords(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0006,
        lng: prev.lng + (Math.random() - 0.5) * 0.0006,
      }));
      steps++;
      if (steps >= 10) {
        clearInterval(interval);
        sfx('success');
        showToast('🛰️ GPS radar sweep complete!', 'success');
      }
    }, 200);
    sfx('scan');
    showToast('🛰️ Simulating GPS drift...', 'info');
  };

  const requestRealGPS = (onSuccess, onError) => {
    if (!navigator.geolocation) {
      onError?.('Geolocation not supported');
      return;
    }
    showToast('🛰️ Requesting device GPS...', 'info');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setUseRealGPS(true);
        sfx('success');
        showToast('📍 Real GPS synced!', 'success');
        if (typeof onSuccess === 'function') onSuccess();
      },
      (err) => {
        sfx('error');
        showToast(`❌ GPS denied: ${err.message}`, 'error');
        if (typeof onError === 'function') onError(err.message);
      }
    );
  };

  // ─────────────────────────────────────────────────────
  // Developer Actions (Calls Backend)
  // ─────────────────────────────────────────────────────
  const devAddCoins = async (amount) => {
    try {
      const res = await fetch('/api/dev/add-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        sfx('coin');
        showToast(`🛠️ Dev: +${amount} SC added`, 'success');
        await fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const devReset = async () => {
    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' });
      if (res.ok) {
        sfx('success');
        showToast('🛠️ Dev: Central backend simulator states reset!', 'info');
        await fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────

  return (
    <AppContext.Provider value={{
      // Auth
      currentUser, login, logout,
      // Customer
      balance, setBalance, dailyClaimed, transactions,
      claimDailyReward,
      // Orders
      pendingOrder, setPendingOrder, placeOrder, cancelOrder,
      shopOrders, dispatchOTPEmailBackend,
      // Shopkeeper
      approveOrder,
      // GPS
      userCoords, setUserCoords, useRealGPS, setUseRealGPS,
      driftGPS, requestRealGPS,
      // Shops
      shops: SHOPS,
      // UI
      toast, showToast,
      muted, setMuted, sfx,
      // Dev
      devAddCoins, devReset,
    }}>
      {children}
    </AppContext.Provider>
  );
};
