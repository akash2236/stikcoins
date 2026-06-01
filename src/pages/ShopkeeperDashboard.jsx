import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const C = {
  bg: '#08080A',
  surface: '#121217',
  surfaceLight: '#1B1B22',
  green: '#4ADE80',
  greenGlow: 'rgba(74,222,128,0.12)',
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  gray: '#94A3B8',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.15)',
};

export default function ShopkeeperDashboard() {
  const {
    currentUser,
    logout,
    pendingOrder,
    approveOrder,
    shopOrders,
    shops,
    showToast,
    sfx,
    devReset,
  } = useApp();

  const navigate = useNavigate();

  const [activeShopId, setActiveShopId] = useState(currentUser?.shopId || 's1');
  const [isScanning, setIsScanning] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  // Redirect if not authenticated as merchant
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'shopkeeper') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const activeShop = shops.find(s => s.id === activeShopId);

  // Auto-switch terminal mismatch
  const handleAutoSyncPOS = () => {
    if (!pendingOrder) return;
    setActiveShopId(pendingOrder.shop.id);
    sfx('success');
    showToast(`⚡ POS Counter auto-synced to ${pendingOrder.shop.name}!`, 'success');
  };

  // Scan QR/Barcode
  const handleScanClick = () => {
    if (!pendingOrder) return;
    setIsScanning(true);
    sfx('scan');

    // Simulate scanning laser sweeping over 1.8s
    setTimeout(() => {
      setIsScanning(false);
      executeRedeemConfirmation(true); // Bypass verification because scanner matches directly!
    }, 1800);
  };

  // Verify OTP manually
  const handleVerifyOTP = () => {
    if (!pendingOrder) return;
    const cleanInput = otpInput.replace(/[^0-9]/g, '');
    const cleanExpected = pendingOrder.otp.replace(/[^0-9]/g, '');

    if (cleanInput === cleanExpected) {
      executeRedeemConfirmation(false);
    } else {
      sfx('error');
      showToast('❌ Mismatched OTP entered! Please check code.', 'error');
    }
  };

  // Perform backend coin deduction, transactions ledger logging and send confirmation mail
  const executeRedeemConfirmation = async (bypassVerification = false) => {
    if (!pendingOrder) return;
    
    // Call backend API to approve
    const result = await approveOrder(bypassVerification ? pendingOrder.otp : otpInput, bypassVerification);
    
    if (result.success) {
      setOtpInput('');
    }
  };

  // Calculate stats for current active shop
  const currentShopRevenue = shopOrders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + o.price, 0);

  if (!currentUser || !activeShop) return null;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: C.bg,
      color: C.white,
      fontFamily: "'DM Sans', sans-serif",
      padding: '24px 16px 80px 16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes laserScan { 0% { top: 0%; opacity: 0.1; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0.1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: ${C.gold}b0; }
        .btn-action { transition: all 0.12s ease; cursor: pointer; }
        .btn-action:hover { opacity: 0.95; }
        .btn-action:active { transform: scale(0.96); }
        .btn-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        
        /* Dual column desktop pos layout */
        .merchant-grid { display: flex; flex-direction: column; gap: 20px; width: 100%; }
        
        .mobile-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(18, 18, 23, 0.95); border-top: 1px solid ${C.border}; padding: 12px 24px; justify-content: space-around; z-index: 100; backdrop-filter: blur(10px); padding-bottom: max(12px, env(safe-area-inset-bottom)); }
        .desktop-actions { display: none; }
        
        @media(min-width: 768px) {
          .merchant-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
          .mobile-nav { display: none; }
          .desktop-actions { display: flex; }
        }
      `}</style>

      {/* ========================================== */}
      {/* DYNAMIC RESPONSIVE FULL APPLICATION VIEW */}
      {/* ========================================== */}
      <div className="sk-panel sk-texture" style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '650px',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        
        {/* Shopkeeper Header */}
        <div style={{
          padding: '24px',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid var(--sk-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: C.goldLight }}>Stikbook Partner</span>
              <span style={{ fontSize: '9px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: C.gold, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>MERCHANT</span>
            </div>
            <span style={{ fontSize: '11px', color: C.gray }}>Cashier Checkout POS Gateway</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="desktop-actions" style={{ gap: '8px', borderRight: `1px solid ${C.border}`, paddingRight: '14px' }}>
              <button 
                onClick={devReset} 
                title="Reset Server"
                className="btn-action" 
                style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: `1px solid ${C.error}40`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', color: C.error }}
              >
                🔄
              </button>
              <button 
                onClick={logout} 
                title="Logout"
                className="btn-action" 
                style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: C.surfaceLight, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', color: C.white }}
              >
                🚪
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: C.white, fontWeight: 'bold' }}>{currentUser.name}</div>
                <div style={{ fontSize: '9px', color: C.gold }}>Cashier Desk</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: C.surfaceLight, border: `2px solid ${C.gold}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', boxShadow: `0 0 10px ${C.gold}30` }}>
                {currentUser.avatar}
              </div>
            </div>
          </div>
        </div>

        {/* Select Active Merchant Dropdown & Revenue Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 24px',
          backgroundColor: '#16161D',
          alignItems: 'center',
          borderBottom: `1px solid ${C.border}`
        }}>
          {/* Active Terminal Selection */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <label style={{ fontSize: '10px', color: C.gray, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🏪 Active POS Terminal Outlet:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => {
                    setActiveShopId(shop.id);
                    sfx('scan');
                  }}
                  className={activeShopId === shop.id ? "sk-inset" : "sk-button"}
                  style={{
                    flex: 1, padding: '8px 6px',
                    color: activeShopId === shop.id ? C.gold : C.white,
                    border: activeShopId === shop.id ? `1px solid ${C.gold}` : undefined,
                    borderRadius: '8px', fontSize: '10px', fontWeight: 'bold',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{shop.icon}</span>
                  <span style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%' }}>{shop.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Revenue metrics card */}
          <div className="sk-screen" style={{
            flex: '1 1 200px',
            padding: '10px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: '9px', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Revenue</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }} className="sk-led-text">
                <span style={{ fontSize: '24px', fontWeight: '800', color: C.goldLight }}>{currentShopRevenue}</span>
                <span style={{ fontSize: '12px', color: C.gold, fontWeight: 'bold' }}>SC</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '9px', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Redemptions</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: C.white }}>
                {shopOrders.length} Completed
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic content area in Dual Column format */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
          
          <div className="merchant-grid">
            
            {/* LEFT COLUMN: ACTIVE CHECKOUT REGISTER SCREEN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🛒 Live POS Checkout Register
              </span>

              {/* NO ACTIVE SIGNALS STATE */}
              {!pendingOrder && (
                <div className="sk-inset" style={{
                  minHeight: '260px', border: '1.5px dashed rgba(255,255,255,0.06)',
                  padding: '24px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '36px', animation: 'float 3s infinite' }}>📡</span>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>Awaiting Customer Broadcast Signal</h5>
                    <p style={{ margin: 0, fontSize: '11px', color: C.gray, lineHeight: '1.4' }}>
                      Once a customer initiates a redemption at <strong>{activeShop.name}</strong>, their secure POS token credentials will broadcast here immediately via the server.
                    </p>
                  </div>
                </div>
              )}

              {/* SCANNING LASER VIEW ACTIVE */}
              {pendingOrder && isScanning && (
                <div className="sk-screen" style={{
                  minHeight: '260px', borderRadius: '16px', border: `2.5px solid ${C.gold}`,
                  position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  <div className="laser-sweep" style={{
                    position: 'absolute', left: 0, right: 0, height: '3px',
                    backgroundColor: C.gold, boxShadow: `0 0 10px 3px ${C.gold}`, zIndex: 10,
                    animation: 'laserScan 1.8s linear infinite'
                  }} />

                  {/* Viewfinder Target */}
                  <div style={{ border: `1.5px solid ${C.gold}50`, width: '130px', height: '130px', borderRadius: '16px', position: 'relative', opacity: 0.8 }}>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', borderTop: '3px solid #FFF', borderLeft: '3px solid #FFF' }}></div>
                    <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderTop: '3px solid #FFF', borderRight: '3px solid #FFF' }}></div>
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '16px', height: '16px', borderBottom: '3px solid #FFF', borderLeft: '3px solid #FFF' }}></div>
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', borderBottom: '3px solid #FFF', borderRight: '3px solid #FFF' }}></div>
                  </div>

                  <span style={{ fontSize: '10px', color: C.gold, fontWeight: 'bold', marginTop: '16px', letterSpacing: '0.8px' }}>
                    SIMULATING OPTICAL POS QR SCAN...
                  </span>
                </div>
              )}

              {/* PENDING REDEMPTION SIGNAL DETECTED */}
              {pendingOrder && !isScanning && (
                <div className="sk-panel" style={{
                  minHeight: '260px', border: `1.5px solid ${pendingOrder.shop.id === activeShopId ? C.gold : 'rgba(255,255,255,0.05)'}`,
                  padding: '16px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', gap: '14px', animation: 'fadeIn 0.2s ease-out'
                }}>
                  {/* Header Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: C.gold, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.gold, display: 'inline-block', boxShadow: `0 0 6px ${C.gold}` }}></span>
                      INCOMING TRANSACTION BROADCAST
                    </span>
                    <span style={{ fontSize: '9px', color: C.gray }}>Server-synced channel</span>
                  </div>

                  {/* Terminal Shop mismatch handling */}
                  {pendingOrder.shop.id !== activeShopId ? (
                    <div style={{
                      padding: '10px 14px', backgroundColor: C.errorGlow, border: `1px solid ${C.error}`,
                      borderRadius: '10px', fontSize: '11px', color: '#FFF', margin: '4px 0',
                      display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                      <div>⚠️ <strong>POS Terminal Mismatch!</strong> Order was placed for <strong>{pendingOrder.shop.name}</strong>, but your cashier is currently set to <strong>{activeShop.name}</strong>.</div>
                      <button onClick={handleAutoSyncPOS} className="btn-action" style={{ backgroundColor: '#FFF', color: '#000', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '10px', fontWeight: 'bold' }}>
                        ⚡ Auto-Sync Cashier POS Desk
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', backgroundColor: 'rgba(74,222,128,0.04)', border: `1px solid ${C.green}33`, borderRadius: '8px', fontSize: '11px', color: C.green }}>
                      ✓ Cashier POS Counter successfully synced with customer credentials!
                    </div>
                  )}

                  {/* Product and Customer card details */}
                  <div className="sk-screen" style={{ padding: '12px' }}>
                    <span style={{ fontSize: '9px', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Account</span>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>{pendingOrder.customer.name}</div>
                    <div style={{ fontSize: '10px', color: C.gray, fontFamily: 'monospace' }}>{pendingOrder.customer.email}</div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '20px' }}>{pendingOrder.product.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{pendingOrder.product.name}</span>
                      </div>
                      <span className="sk-led-text" style={{ fontSize: '16px', fontWeight: 'bold' }}>{pendingOrder.product.price} SC</span>
                    </div>
                  </div>

                  {/* POS Trigger Scanners & Verification fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={handleScanClick}
                      disabled={pendingOrder.shop.id !== activeShopId}
                      className="sk-button"
                      style={{
                        padding: '10px', fontSize: '12px', color: C.gold, display: 'flex',
                        justifyContent: 'center', alignItems: 'center', gap: '6px'
                      }}
                    >
                      📷 Scan Customer QR Code (Camera Scanner)
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                      <span style={{ fontSize: '9px', color: C.gray, padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Or Manual OTP Verification</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value)}
                          className="sk-inset"
                          style={{
                            width: '100%', border: `1px solid rgba(255,255,255,0.08)`,
                            padding: '8px 52px 8px 12px', color: C.goldLight, fontSize: '14px', boxSizing: 'border-box', outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => { setOtpInput(pendingOrder.otp); sfx('scan'); }}
                          style={{
                            position: 'absolute', right: '6px', top: '6px', bottom: '6px',
                            backgroundColor: C.surfaceLight, border: 'none', color: C.gold,
                            borderRadius: '6px', fontSize: '9px', padding: '0 8px', fontWeight: 'bold', cursor: 'pointer'
                          }}
                        >
                          Autofill
                        </button>
                      </div>
                      <button
                        onClick={handleVerifyOTP}
                        disabled={pendingOrder.shop.id !== activeShopId}
                        className="sk-button"
                        style={{ padding: '0 16px', fontSize: '12px', color: C.goldLight }}
                      >
                        Verify Code
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: SALES LOG TABLE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: C.gray }}>
                📝 Completed Outlet Transactions ({shopOrders.length})
              </span>
              
              <div className="custom-scroll" style={{
                flex: 1,
                minHeight: '260px',
                maxHeight: '400px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px'
              }}>
                {shopOrders.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', opacity: 0.35, minHeight: '220px', border: `1px dashed ${C.border}`,
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '32px' }}>📝</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '8px' }}>No Completed Sales Today</span>
                  </div>
                ) : (
                  shopOrders.map((so, i) => (
                    <div key={i} className="sk-button" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px' }}>{so.productIcon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{so.productName}</span>
                          <span style={{ fontSize: '9px', color: C.gray }}>👤 {so.customerName} • {so.date}</span>
                        </div>
                      </div>
                      <span className="sk-led-text" style={{ fontSize: '13px', fontWeight: 'bold' }}>+{so.price} SC</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* POS Footer security banner */}
        <div style={{ backgroundColor: '#131317', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlignment: 'center', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '10px', color: C.gray, display: 'flex', alignItems: 'center', gap: '5px' }}>
            🔒 Stik-Block POS Secured Gateway Network · Transaction Logs Audited Real-Time
          </span>
        </div>

      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-nav">
        <button
          onClick={devReset}
          className="btn-action"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: C.error }}
        >
          <span style={{ fontSize: '20px' }}>🔄</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Reset Server</span>
        </button>
        
        <div style={{ width: '1px', backgroundColor: C.border, height: '30px', alignSelf: 'center' }}></div>

        <button
          onClick={logout}
          className="btn-action"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: C.gray }}
        >
          <span style={{ fontSize: '20px' }}>🚪</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
