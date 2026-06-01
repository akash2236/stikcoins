import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const C = {
  bg: '#0F1015',
  surface: '#1A1B23',
  surfaceLight: '#252631',
  green: '#10B981',
  greenGlow: 'rgba(16, 185, 129, 0.15)',
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  border: 'rgba(255,255,255,0.08)',
  white: '#F8FAFC',
  gray: '#94A3B8',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.15)',
};

// Map Recenter Component (Moved outside to prevent re-mounting on parent re-renders)
function MapRecenter({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo([coords.lat, coords.lng], 14, { animate: true, duration: 1.5 });
  }, [coords.lat, coords.lng, map]);
  return null;
}

export default function CustomerDashboard() {
  const {
    currentUser,
    logout,
    balance,
    dailyClaimed,
    transactions,
    claimDailyReward,
    pendingOrder,
    placeOrder,
    cancelOrder,
    userCoords,
    driftGPS,
    shops,
    showToast,
    sfx,
    dispatchOTPEmailBackend,
    requestRealGPS,
    useRealGPS,
  } = useApp();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('redeem');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isRadarCollapsed, setIsRadarCollapsed] = useState(false);
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Auto-request live device GPS on dashboard load
    if (!useRealGPS && navigator.geolocation) {
      requestRealGPS();
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (currentUser?.email && !emailInput) {
      setEmailInput(currentUser.email);
    }
  }, [currentUser, emailInput]);

  const handleEmailOTP = async () => {
    if (!pendingOrder) return;
    if (!emailInput) {
      showToast('❌ Please enter a valid email address.', 'error');
      sfx('error');
      return;
    }

    setSendingEmail(true);
    sfx('scan');
    showToast('✉️ Sending secure OTP email...', 'info');

    const result = await dispatchOTPEmailBackend(emailInput);

    setSendingEmail(false);

    if (result.success) {
      showToast(`🎉 OTP successfully sent to ${emailInput}! Check your inbox.`, 'success');
      sfx('success');
    } else {
      showToast(`✉️ Failed to send email.`, 'error');
      sfx('error');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const liveShops = useMemo(() => {
    return shops.map((shop, i) => {
      // Dynamically offset shops around the user's live GPS for universal mapping
      const latOffset = (i % 2 === 0 ? 1 : -1) * 0.003 * (i + 1);
      const lngOffset = (i % 3 === 0 ? -1 : 1) * 0.004 * (i + 1);
      const dynamicLat = userCoords.lat + latOffset;
      const dynamicLng = userCoords.lng + lngOffset;
      
      const distance = calculateDistance(userCoords.lat, userCoords.lng, dynamicLat, dynamicLng);
      return { ...shop, baseLat: dynamicLat, baseLng: dynamicLng, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [userCoords, shops]);

  // Leaflet Icons
  const userIcon = useMemo(() => new L.DivIcon({
    className: 'custom-user-icon',
    html: `<div style="font-size:28px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: translate(-50%, -50%);">📍</div>`,
    iconSize: [0, 0]
  }), []);

  const createShopIcon = (icon) => new L.DivIcon({
    className: 'custom-shop-icon',
    html: `<div style="background: #1A1B23; border: 2px solid ${C.green}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); transform: translate(-50%, -50%);">${icon}</div>`,
    iconSize: [0, 0]
  });

  const handleRedeemClick = async (shop, product) => {
    if (balance < product.price) {
      sfx('error');
      showToast(`❌ Insufficient coins! You need ${product.price - balance} more SC.`, 'error');
      return;
    }
    await placeOrder(shop, product, emailInput);
  };

  if (!currentUser) return null;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: C.bg,
      color: C.white,
      fontFamily: "'Inter', 'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column', // mobile default
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 ${C.green}40; } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(0,0,0,0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); } }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .btn-action { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; font-family: inherit; }
        .btn-action:hover { filter: brightness(1.1); }
        .btn-action:active { filter: brightness(0.9); }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }
        
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); background-color: ${C.surfaceLight}; }
        
        .layout-container { display: flex; flex-direction: column; width: 100%; min-height: 100vh; }
        .sidebar { display: none; }
        .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: ${C.surface}; border-top: 1px solid ${C.border}; padding: 12px 16px; justify-content: space-around; z-index: 100; padding-bottom: max(12px, env(safe-area-inset-bottom)); backdrop-filter: blur(10px); background: rgba(26, 27, 35, 0.9); }
        .main-content { padding: 20px 16px 80px 16px; flex: 1; overflow-y: auto; }
        .grid-layout { display: flex; flex-direction: column; gap: 20px; }
        
        @media(min-width: 1024px) {
          .layout-container { flex-direction: row; }
          .sidebar { display: flex; flex-direction: column; width: 280px; background: ${C.surface}; border-right: 1px solid ${C.border}; padding: 32px 24px; position: sticky; top: 0; height: 100vh; box-sizing: border-box; }
          .bottom-nav { display: none; }
          .main-content { padding: 40px 48px; max-width: 1200px; margin: 0 auto; }
          .grid-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 32px; align-items: start; }
        }
      `}</style>

      <div className="layout-container">
        {/* DESKTOP SIDEBAR */}
        <div className="sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${C.green}, #047857)`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff', boxShadow: `0 4px 12px ${C.green}40` }}>S</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Stikbook</div>
              <div style={{ fontSize: '10px', color: C.green, fontWeight: '700', letterSpacing: '1px' }}>WALLET</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {[
              { id: 'redeem', icon: '🛍️', label: 'Spend Coins' },
              { id: 'activity', icon: '📊', label: 'Transactions' },
              { id: 'claim', icon: '🎁', label: 'Daily Rewards' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); sfx('scan'); }}
                className={activeTab === item.id ? "sk-button" : "btn-action"}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  backgroundColor: activeTab === item.id ? 'var(--sk-bg)' : 'transparent',
                  color: activeTab === item.id ? C.green : C.gray,
                  borderRadius: '12px', fontSize: '15px', fontWeight: '600',
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2D2E3D', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                {currentUser.avatar}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.name}</div>
                <div style={{ fontSize: '12px', color: C.gray, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn-action"
              style={{ width: '100%', marginTop: '12px', padding: '12px', backgroundColor: 'transparent', color: C.gray, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-content custom-scroll">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="mobile-only-header">
            <style>{`@media(min-width: 1024px) { .mobile-only-header { display: none !important; } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2D2E3D', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                {currentUser.avatar}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: C.gray }}>Welcome back,</div>
                <div style={{ fontSize: '16px', fontWeight: '800' }}>{currentUser.name}</div>
              </div>
            </div>
             <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `linear-gradient(135deg, ${C.green}, #047857)`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>S</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                {activeTab === 'redeem' ? 'Spend Coins' : activeTab === 'activity' ? 'Transactions' : 'Daily Rewards'}
              </h1>
              <p style={{ color: C.gray, margin: 0, fontSize: '14px' }}>
                {activeTab === 'redeem' ? 'Find nearby stores to redeem your balance.' : activeTab === 'activity' ? 'Your recent Stikcoin ledger.' : 'Claim your daily check-in bonus.'}
              </p>
            </div>
          </div>

          {/* Balance Banner (Always visible) */}
          <div className="sk-panel sk-texture" style={{
            padding: '28px 32px', marginBottom: '32px',
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center', gap: '20px',
          }}>
            <div>
               <span style={{ fontSize: '13px', color: C.gray, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Current Balance</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <img src="/stik_coin.png" alt="StikCoin" style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))' }} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }} className="sk-led-text">
                    <span style={{ fontSize: '56px', fontWeight: '800', letterSpacing: '-2px', lineHeight: 1 }}>{balance}</span>
                    <span style={{ fontSize: '22px', fontWeight: '700', opacity: 0.8 }}>SC</span>
                  </div>
               </div>
            </div>
            {!dailyClaimed && activeTab !== 'claim' && (
              <button
                onClick={() => { setActiveTab('claim'); sfx('scan'); }}
                className="sk-button"
                style={{ padding: '12px 20px', color: C.goldLight }}
              >
                Claim Daily Bonus →
              </button>
            )}
          </div>

          {/* TAB CONTENT: REDEEM */}
          {activeTab === 'redeem' && (
            <div className="grid-layout">
              {/* Radar Area */}
              <div className="sk-panel" style={{
                padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }} className="sk-led-text">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: useRealGPS ? C.green : C.gold, display: 'inline-block', boxShadow: `0 0 8px ${useRealGPS ? C.green : C.gold}` }}></span>
                    Live Radar {useRealGPS ? '(Real GPS)' : '(Simulated)'}
                  </span>
                  <button onClick={() => requestRealGPS()} className="sk-button" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    📍 Sync Device GPS
                  </button>
                </div>

                <div className="sk-screen" style={{ position: 'relative', width: '100%', height: '300px', margin: '10px 0', padding: '8px' }}>
                  <MapContainer center={[userCoords.lat, userCoords.lng]} zoom={14} style={{ width: '100%', height: '100%', backgroundColor: '#0F1015', borderRadius: '12px' }} zoomControl={false}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <MapRecenter coords={userCoords} />
                    
                    {/* Radar Pulse Effect */}
                    <Circle center={[userCoords.lat, userCoords.lng]} radius={400} pathOptions={{ color: C.green, fillColor: C.green, fillOpacity: 0.1, weight: 1 }} />
                    <Circle center={[userCoords.lat, userCoords.lng]} radius={800} pathOptions={{ color: C.green, fillColor: 'transparent', opacity: 0.2, weight: 1 }} />

                    {/* User Marker */}
                    <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
                      <Popup>
                        <div style={{ color: '#000', fontWeight: 'bold' }}>You are here</div>
                      </Popup>
                    </Marker>

                    {/* Shop Markers */}
                    {liveShops.map((shop) => (
                      <Marker 
                        key={shop.id} 
                        position={[shop.baseLat, shop.baseLng]} 
                        icon={createShopIcon(shop.icon)}
                        eventHandlers={{
                          click: () => { setSelectedShop(shop); sfx('scan'); }
                        }}
                      >
                        <Popup>
                          <div style={{ color: '#000', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{shop.name}</div>
                            <div style={{ color: '#666', fontSize: '12px' }}>{shop.distance}m away</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Shops List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Nearby Merchants</h3>
                {liveShops.map((shop) => {
                  const isSel = selectedShop?.id === shop.id;
                  return (
                    <div
                      key={shop.id}
                      onClick={() => { setSelectedShop(isSel ? null : shop); sfx('scan'); }}
                      className={isSel ? "sk-inset" : "sk-button"}
                      style={{
                        padding: '20px', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: isSel ? `1px solid ${C.green}` : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className={isSel ? "" : "sk-screen"} style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${shop.color}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                          {shop.icon}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: isSel ? C.green : '#F8FAFC' }}>{shop.name}</div>
                          <div style={{ fontSize: '13px', color: C.gray }}>⭐ {shop.rating} • {shop.products.length} Items</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="sk-led-text" style={{ fontSize: '14px', fontWeight: '700' }}>{shop.distance}m</div>
                        <div style={{ fontSize: '11px', color: C.gray, textTransform: 'uppercase' }}>away</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ACTIVITY */}
          {activeTab === 'activity' && (
            <div style={{ backgroundColor: C.surface, borderRadius: '24px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {transactions.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: C.gray }}>No transaction records yet.</div>
              ) : (
                <div>
                  {transactions.map((tx, idx) => (
                    <div key={tx.id} style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== transactions.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: C.surfaceLight, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                          {tx.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>{tx.title}</div>
                          <div style={{ fontSize: '12px', color: C.gray }}>{tx.shopName} • {tx.date}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: tx.type === 'redeem' ? C.error : C.green }}>
                        {tx.type === 'redeem' ? '-' : '+'}{tx.amount} SC
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: CLAIM */}
          {activeTab === 'claim' && (
            <div style={{
              padding: '60px 20px', backgroundColor: C.surface, borderRadius: '24px',
              textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
              border: `1px solid ${C.border}`, maxWidth: '500px', margin: '0 auto'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px', animation: 'fadeIn 0.5s ease-out' }}>🎁</div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0' }}>Daily Check-In</h3>
              <p style={{ color: C.gray, margin: '0 0 32px 0', fontSize: '15px', lineHeight: '1.5' }}>Claim your free 10 Stikcoins every 24 hours. Keep your streak alive to unlock mystery rewards!</p>
              
              <button
                onClick={claimDailyReward}
                disabled={dailyClaimed}
                className="btn-action"
                style={{
                  width: '100%', padding: '16px', backgroundColor: dailyClaimed ? C.surfaceLight : C.green,
                  color: dailyClaimed ? C.gray : '#000', borderRadius: '14px', fontWeight: '800', fontSize: '16px'
                }}
              >
                {dailyClaimed ? '✓ Come back tomorrow' : 'Claim +10 SC Now'}
              </button>
            </div>
          )}
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="bottom-nav">
          {[
            { id: 'redeem', icon: '🛍️', label: 'Spend' },
            { id: 'activity', icon: '📊', label: 'Ledger' },
            { id: 'claim', icon: '🎁', label: 'Claim' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); sfx('scan'); }}
              className="btn-action"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                background: 'none', color: activeTab === item.id ? C.green : C.gray,
                opacity: activeTab === item.id ? 1 : 0.7
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>{item.label}</span>
            </button>
          ))}
           <button onClick={logout} className="btn-action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', color: C.gray, opacity: 0.7 }}>
              <span style={{ fontSize: '20px' }}>🚪</span>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>Exit</span>
            </button>
        </div>

        {/* CATALOG MODAL */}
        {selectedShop && !pendingOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="sk-panel" style={{ width: '100%', maxWidth: '600px', padding: '24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="sk-screen" style={{ fontSize: '28px', padding: '8px', borderRadius: '12px' }}>{selectedShop.icon}</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{selectedShop.name}</div>
                    <div style={{ fontSize: '13px', color: C.gray }}>Select an item to redeem</div>
                  </div>
                </div>
                <button onClick={() => setSelectedShop(null)} className="sk-button" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              
              <div className="custom-scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                {selectedShop.products.map(product => {
                  const hasCoins = balance >= product.price;
                  return (
                    <div key={product.id} className="sk-inset" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '32px' }}>{product.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{product.name}</div>
                        <div style={{ fontSize: '13px', color: C.gray, lineHeight: '1.4' }}>{product.desc}</div>
                      </div>
                      <button
                        onClick={() => handleRedeemClick(selectedShop, product)}
                        className={hasCoins ? "sk-button" : "sk-inset"}
                        style={{ padding: '10px 16px', fontSize: '14px', whiteSpace: 'nowrap', border: hasCoins ? undefined : `1px solid ${C.error}` }}
                      >
                        <span className={hasCoins ? "sk-led-text" : ""} style={{ color: hasCoins ? C.green : C.error }}>{product.price} SC</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE OTP & QR OVERLAY */}
        {pendingOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg, zIndex: 1100, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${C.green}, #047857)`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>🔒</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800' }}>Secure Checkout</div>
                    <div style={{ fontSize: '12px', color: C.green }}>Backend Verified Session</div>
                  </div>
                </div>
                <button onClick={cancelOrder} className="btn-action" style={{ backgroundColor: C.surfaceLight, padding: '10px 20px', borderRadius: '12px', color: C.white, fontWeight: '600' }}>Cancel</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', flex: 1, alignItems: 'center' }}>
                
                {/* Left: Product & OTP */}
                <div style={{ backgroundColor: C.surface, padding: '40px 32px', borderRadius: '24px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: C.gray, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Present to Cashier at</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>{pendingOrder.shop.icon} {pendingOrder.shop.name}</div>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', backgroundColor: C.surfaceLight, padding: '12px 20px', borderRadius: '16px', marginBottom: '40px' }}>
                    <span style={{ fontSize: '24px' }}>{pendingOrder.product.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{pendingOrder.product.name}</div>
                      <div style={{ fontSize: '13px', color: C.green, fontWeight: '600' }}>{pendingOrder.product.price} SC</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: C.gray, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>6-Digit OTP Code</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                    {pendingOrder.otp.split('').map((char, i) => (
                      <div key={i} style={{ width: '48px', height: '56px', backgroundColor: '#111827', border: `2px solid ${C.green}`, borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: '800', color: C.green }}>{char}</div>
                    ))}
                  </div>
                  <div style={{ fontSize: '13px', color: C.gray }}>Expires in <span style={{ color: C.gold, fontWeight: '700' }}>5:00</span></div>
                </div>

                {/* Right: Real QR & Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ backgroundColor: '#FFF', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                    <QRCodeSVG value={pendingOrder.otp} size={200} level="H" bgColor="#FFFFFF" fgColor="#000000" />
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '800', letterSpacing: '2px', marginTop: '20px' }}>SCAN AT REGISTER</div>
                  </div>

                  <div style={{ backgroundColor: C.surface, padding: '24px', borderRadius: '20px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>✉️ Dispatch Email Receipt</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="your@email.com"
                        style={{ flex: 1, backgroundColor: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 16px', color: C.white, fontSize: '14px', outline: 'none' }}
                      />
                      <button
                        onClick={handleEmailOTP}
                        disabled={sendingEmail}
                        className="btn-action"
                        style={{ backgroundColor: C.green, color: '#000', border: 'none', borderRadius: '12px', padding: '0 20px', fontWeight: '700', fontSize: '14px' }}
                      >
                        {sendingEmail ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
