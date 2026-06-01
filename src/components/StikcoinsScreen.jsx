import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- SOUND EFFECTS SYNTHESIZER (WEB AUDIO API) ---
const playSound = (type, muted) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    
    if (type === 'coin') {
      // Classic Double Ding retro sound (C5 -> E5)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      
      osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.08); // C6 (octave harmonic)
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.35);
      osc2.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'success') {
      // Ascending triumphant synth arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4 -> C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.06);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + idx * 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.06 + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.06);
        osc.stop(audioCtx.currentTime + idx * 0.06 + 0.25);
      });
    } else if (type === 'error') {
      // Buzzing error sound
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.22);
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } else if (type === 'scan') {
      // Modern high-tech camera beep
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (err) {
    console.warn("Web Audio API blocked or not supported on this device.", err);
  }
};

export default function StikcoinsScreen() {
  // --- STATE SYSTEM ---
  const [balance, setBalance] = useState(590); // 590 SC initial balance
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isAudioVisualizing, setIsAudioVisualizing] = useState(false);
  
  // Tabs: 'redeem' | 'activity' | 'claim'
  const [activeTab, setActiveTab] = useState('redeem');

  // GPS & Location States
  const [userCoords, setUserCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Central Bangalore coords
  const [isDrifting, setIsDrifting] = useState(false);
  const [radarPulse, setRadarPulse] = useState(false);
  const [useRealGPS, setUseRealGPS] = useState(false);
  const [isRadarCollapsed, setIsRadarCollapsed] = useState(false);

  // Shop & Product Selection
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Pending Order states
  const [pendingRedeem, setPendingRedeem] = useState(null); // { shop, product, otp, qrCode, expiry }
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes countdown
  
  // Notifications/Errors
  const [toast, setToast] = useState(null); // { message, type: 'error' | 'success' | 'info' }

  // Shopkeeper simulation details
  const [shopkeeperShopId, setShopkeeperShopId] = useState('s1');
  const [isScanning, setIsScanning] = useState(false);
  const [manualOtpInput, setManualOtpInput] = useState('');
  const [showRedeemSuccessModal, setShowRedeemSuccessModal] = useState(false);
  const [lastRedeemedProduct, setLastRedeemedProduct] = useState(null);

  // Transaction Ledger (Past Activity)
  const [transactions, setTransactions] = useState([
    { id: 'tx-0', type: 'bonus', amount: 580, title: 'Stikbook Welcome Pack', date: 'Yesterday, 04:30 PM', shopName: 'Stikbook Corporate' },
    { id: 'tx-1', type: 'reward', amount: 10, title: 'Sign-in Streak Bonus', date: 'Today, 09:15 AM', shopName: 'Stikbook App' }
  ]);

  // General theme colors
  const colors = {
    background: '#08080A',
    surface: '#121217',
    surfaceLight: '#1B1B22',
    primaryGreen: '#4ADE80',
    primaryGreenGlow: 'rgba(74, 222, 128, 0.12)',
    border: 'rgba(255, 255, 255, 0.06)',
    textWhite: '#FFFFFF',
    textGray: '#94A3B8',
    gold: '#F59E0B',
    goldLight: '#FBBF24',
    errorRed: '#EF4444',
    errorRedGlow: 'rgba(239, 68, 68, 0.15)'
  };

  const fonts = {
    body: "'DM Sans', sans-serif",
    handwritten: "'Caveat', cursive, sans-serif"
  };

  // Trigger audio visualizer bar jump
  const triggerAudioVisualEffect = () => {
    setIsAudioVisualizing(true);
    setTimeout(() => setIsAudioVisualizing(false), 800);
  };

  const playSoundEffect = (type) => {
    playSound(type, muted);
    triggerAudioVisualEffect();
  };

  // --- REGISTERED SHOPS DATA ---
  const initialShops = useMemo(() => [
    {
      id: 's1',
      name: 'Cafe Espresso & Co.',
      rating: '4.8',
      type: 'Premium Coffee & Beverages',
      baseLat: 12.9723, 
      baseLng: 77.5951,
      icon: '☕',
      color: '#FBBF24',
      products: [
        { id: 'p11', name: 'Cold drink', price: 50, icon: '🥤', desc: 'Chilled fizzy cola with lemon infusion' },
        { id: 'p12', name: 'Gourmet Cappuccino', price: 80, icon: '☕', desc: 'Fresh roasted double espresso with microfoam' },
        { id: 'p13', name: 'Warm Chocolate Muffin', price: 110, icon: '🧁', desc: 'Fudgy melt-in-mouth triple chocolate chips' },
      ]
    },
    {
      id: 's2',
      name: 'Organic Green Market',
      rating: '4.9',
      type: 'Fresh Groceries & Juices',
      baseLat: 12.9709,
      baseLng: 77.5936,
      icon: '🍎',
      color: '#4ADE80',
      products: [
        { id: 'p21', name: 'Cold-Pressed Apple Juice', price: 65, icon: '🧃', desc: '100% natural organic locally-harvested apples' },
        { id: 'p22', name: 'Tropical Smoothie Bowl', price: 90, icon: '🍌', desc: 'Greek yogurt topped with organic honey & berries' },
        { id: 'p23', name: 'Gourmet Avocado Mash', price: 140, icon: '🥑', desc: 'Handcrafted avocado spreads with organic sourdough' },
      ]
    },
    {
      id: 's3',
      name: 'Tech & Gadgets Express',
      rating: '4.6',
      type: 'Electronics & Fast Accessories',
      baseLat: 12.9729,
      baseLng: 77.5939,
      icon: '🔌',
      color: '#60A5FA',
      products: [
        { id: 'p31', name: 'Type-C Braided Cable', price: 180, icon: '🔌', desc: 'High-speed 65W power delivery charging cord' },
        { id: 'p32', name: 'Dual Qi Wireless Charger', price: 320, icon: '🔋', desc: 'Anti-slip neon glass dual charging station' },
        { id: 'p33', name: 'Bluetooth ANC Earbuds', price: 500, icon: '🎧', desc: 'Pure base active noise cancelling buds' },
        { id: 'p34', name: 'Mechanical RGB Keyboard', price: 650, icon: '⌨️', desc: 'Premium clicks aluminum keycaps blue-switches' }, // tests insufficiency!
      ]
    },
    {
      id: 's4',
      name: 'Stikbook MegaMart',
      rating: '4.7',
      type: 'Groceries & Hyper Store',
      baseLat: 12.9705,
      baseLng: 77.5959,
      icon: '🛒',
      color: '#EC4899',
      products: [
        { id: 'p41', name: 'Sweet & Salty Snack Box', price: 75, icon: '🍿', desc: 'Assorted artisan chips, popcorn & cookies' },
        { id: 'p42', name: 'Insulated Hydroflask (1L)', price: 290, icon: '🍶', desc: 'Double-walled cold locks stainless steel vacuum' },
        { id: 'p43', name: 'Water-Resistant Duffle', price: 540, icon: '🎒', desc: 'Smart storage lightweight sports & adventure pack' },
      ]
    }
  ], []);

  // --- DYNAMIC DISTANCE CALCULATION (GPS MOCK/REAL) ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine Formula for distance calculation in meters
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // Distance in meters
  };

  // Live shop list mapping based on current GPS location
  const liveShops = useMemo(() => {
    return initialShops.map(shop => {
      const distance = calculateDistance(userCoords.lat, userCoords.lng, shop.baseLat, shop.baseLng);
      return { ...shop, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [userCoords, initialShops]);

  // --- HELPER TO TRIGGER TOASTS ---
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- ACTIONS ---

  // 1. Claim Daily Login (+10 SC)
  const handleClaimDailyLogin = () => {
    if (dailyClaimed) return;
    setBalance(prev => prev + 10);
    setDailyClaimed(true);
    playSoundEffect('coin');
    
    // Add to transaction log
    const now = new Date();
    const formattedDate = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'reward',
        amount: 10,
        title: 'Daily Login Reward',
        date: formattedDate,
        shopName: 'Stikbook Wallet'
      },
      ...prev
    ]);
    showToast('🎁 Claimed +10 Stikcoins Daily Reward!', 'success');
  };

  // 2. Real GPS Finder Activation
  const toggleRealGPS = () => {
    if (!useRealGPS) {
      if (navigator.geolocation) {
        showToast('🛰️ Requesting your device location...', 'info');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords({ lat: latitude, lng: longitude });
            setUseRealGPS(true);
            playSoundEffect('success');
            showToast('📍 Success! Real GPS coordinates synchronized.', 'success');
          },
          (error) => {
            playSoundEffect('error');
            showToast(`❌ GPS Denied: ${error.message}. Using Bangalore simulated mock location.`, 'error');
          }
        );
      } else {
        playSoundEffect('error');
        showToast('❌ Geolocation is not supported by your browser.', 'error');
      }
    } else {
      // Revert to default simulated
      setUserCoords({ lat: 12.9716, lng: 77.5946 });
      setUseRealGPS(false);
      showToast('🛰️ Returned to Simulated GPS environment.', 'info');
    }
  };

  // 3. Simulated Drifting Movement
  const triggerSimulatedDrift = () => {
    if (isDrifting) return;
    setIsDrifting(true);
    setRadarPulse(true);
    playSoundEffect('scan');

    // Simulate stepping coordinates closer/further over 2 seconds
    let stepCount = 0;
    const interval = setInterval(() => {
      setUserCoords(prev => {
        const dLat = (Math.random() - 0.5) * 0.00065; // Drifts slightly
        const dLng = (Math.random() - 0.5) * 0.00065;
        return {
          lat: prev.lat + dLat,
          lng: prev.lng + dLng
        };
      });
      stepCount++;
      if (stepCount >= 10) {
        clearInterval(interval);
        setIsDrifting(false);
        setRadarPulse(false);
        playSoundEffect('success');
        showToast('🛰️ GPS Radar Sweep complete! Distance indices recalculated.', 'success');
      }
    }, 200);
  };

  // 4. User selects a product and taps "Redeem"
  const handleRedeemClick = (shop, product) => {
    setSelectedProduct(product);
    
    // Balance check
    if (balance < product.price) {
      playSoundEffect('error');
      showToast(`❌ Insufficient Coins! You need ${product.price - balance} more Stikcoins (SC).`, 'error');
      return;
    }

    // Generate unique 6-digit OTP & simple SVG barcode content representation
    const otpNumber = Math.floor(100000 + Math.random() * 900000);
    const otpCode = `STK-${otpNumber.toString().slice(0, 3)}-${otpNumber.toString().slice(3)}`;
    const mockQr = `qr-stikbook-${shop.id}-${product.id}-${otpNumber}`;
    
    const pendingOrder = {
      shop,
      product,
      otp: otpCode,
      qrCode: mockQr,
      expiry: Date.now() + 300000 // 5 minutes validity
    };

    setPendingRedeem(pendingOrder);
    setOtpTimer(300);
    
    // Automatically match the partner app simulator merchant shop with current shop for a seamless demo!
    setShopkeeperShopId(shop.id);
    setManualOtpInput('');

    playSoundEffect('success');
    showToast(`⏳ OTP & QR generated for ${product.name}! Confirm scan at the shopkeeper desk.`, 'success');
  };

  // 5. Timer Countdown Effect
  useEffect(() => {
    if (!pendingRedeem) return;
    
    const timer = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPendingRedeem(null);
          playSoundEffect('error');
          showToast('⏰ OTP expired. Please try redeeming again.', 'error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingRedeem]);

  // Format timer seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 6. Shopkeeper App - Complete Redeem Approval (Scanning QR or confirming OTP)
  const handleShopkeeperApprove = (type) => {
    if (!pendingRedeem) {
      playSoundEffect('error');
      showToast("❌ Shopkeeper App: No pending scan signals detected.", "error");
      return;
    }

    if (type === 'otp' && manualOtpInput !== pendingRedeem.otp && manualOtpInput.replace(/[^0-9]/g, '') !== pendingRedeem.otp.replace(/[^0-9]/g, '')) {
      playSoundEffect('error');
      showToast("❌ Shopkeeper App: Invalid OTP entered. Try again.", "error");
      return;
    }

    // Process scanning animation if type is QR
    if (type === 'qr') {
      setIsScanning(true);
      playSoundEffect('scan');
      
      setTimeout(() => {
        setIsScanning(false);
        executeDeduction();
      }, 1800); // 1.8 seconds laser scanning effect
    } else {
      executeDeduction();
    }
  };

  const executeDeduction = () => {
    if (!pendingRedeem) return;

    const price = pendingRedeem.product.price;
    const productName = pendingRedeem.product.name;
    const shopName = pendingRedeem.shop.name;

    // Deduct coins instantly
    setBalance(prev => prev - price);
    playSoundEffect('coin');

    // Save redeemed product details for display modal
    setLastRedeemedProduct({
      name: productName,
      price: price,
      shop: shopName,
      icon: pendingRedeem.product.icon
    });

    // Add record to transaction list (Past Activity)
    const now = new Date();
    const formattedDate = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';
    
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: 'redeem',
        amount: price,
        title: `Redeemed ${productName}`,
        date: formattedDate,
        shopName: shopName
      },
      ...prev
    ]);

    // Reset pending codes
    setPendingRedeem(null);
    setSelectedProduct(null);
    setSelectedShop(null);
    
    // Switch customer to 'activity' tab to see it instantly
    setActiveTab('activity');
    
    // Trigger Success Modal takeover!
    setShowRedeemSuccessModal(true);
    
    setTimeout(() => {
      playSoundEffect('success');
    }, 450);
  };

  // --- DEVELOPER PANEL UTILITIES ---
  const handleDevAddCoins = (amount) => {
    setBalance(prev => prev + amount);
    playSoundEffect('coin');
    showToast(`🛠️ Dev Panel: Added +${amount} SC successfully!`, 'success');
  };

  const handleDevResetAll = () => {
    setBalance(590);
    setDailyClaimed(false);
    setPendingRedeem(null);
    setSelectedShop(null);
    setSelectedProduct(null);
    setTransactions([
      { id: 'tx-0', type: 'bonus', amount: 580, title: 'Stikbook Welcome Pack', date: 'Yesterday, 04:30 PM', shopName: 'Stikbook Corporate' },
      { id: 'tx-1', type: 'reward', amount: 10, title: 'Sign-in Streak Bonus', date: 'Today, 09:15 AM', shopName: 'Stikbook App' }
    ]);
    playSoundEffect('success');
    showToast('🛠️ Dev Panel: Simulation state reset to default (590 SC).', 'success');
  };

  // Winged Gold Coin SVG Component
  const WingedCoinIcon = ({ size = 64 }) => (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: colors.gold,
        border: `3px solid ${colors.goldLight}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
        flexShrink: 0,
        animation: 'float 3s ease-in-out infinite'
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '85%', height: '85%' }}>
        <path d="M 28 48 C 12 40, 10 25, 22 18 C 30 25, 30 38, 38 42 Z" fill={colors.goldLight} opacity="0.9" />
        <path d="M 72 48 C 88 40, 90 25, 78 18 C 70 25, 70 38, 62 42 Z" fill={colors.goldLight} opacity="0.9" />
        <circle cx="50" cy="50" r="32" fill={colors.gold} stroke={colors.goldLight} strokeWidth="2.5" />
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="#FFF"
          style={{
            fontFamily: fonts.handwritten,
            fontSize: '48px',
            fontWeight: '900',
            textShadow: '0.5px 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          S
        </text>
      </svg>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.textWhite,
        fontFamily: fonts.body,
        padding: '16px 12px 24px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowX: 'hidden'
      }}
    >
      {/* Dynamic Style tags for premium micro-animations & layout */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=DM+Sans:wght@400;500;700;800&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes locationPulse {
          0% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.6); }
          70% { transform: scale(1.15); opacity: 0.7; box-shadow: 0 0 0 8px rgba(96, 165, 250, 0); }
          100% { transform: scale(0.9); opacity: 1; box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
        }
        @keyframes laserScan {
          0% { top: 0%; opacity: 0.1; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.1; }
        }
        @keyframes successSparkle {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-60px) scale(1.2); opacity: 0; }
        }
        @keyframes soundWave {
          0%, 100% { height: 3px; }
          50% { height: 14px; }
        }

        /* Beautiful visible dark-mode scrollbars */
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.16);
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.2);
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: ${colors.primaryGreen}b0;
        }

        .btn-premium {
          transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .btn-premium:hover {
          opacity: 0.95;
        }
        .btn-premium:active {
          transform: scale(0.95);
          opacity: 0.88;
        }
        .btn-premium:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .neon-card {
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .neon-glow-hover {
          transition: all 0.2s ease;
        }
        .neon-glow-hover:hover {
          border-color: ${colors.primaryGreen}45 !important;
          box-shadow: 0 4px 16px rgba(74, 222, 128, 0.08);
          background-color: #171720 !important;
        }
        
        .radar-line {
          transform-origin: 100px 100px;
          animation: radarSweep 4.5s linear infinite;
        }
        .laser-sweep {
          animation: laserScan 2s linear infinite;
        }

        /* Success screen animated floating stars/sparkles */
        .sparkle-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: ${colors.primaryGreen};
          border-radius: 50%;
          animation: successSparkle 1.8s infinite ease-out;
        }

        /* Sound EQ Bar Animation */
        .eq-bar {
          width: 2.5px;
          background-color: ${colors.primaryGreen};
          border-radius: 2px;
          display: inline-block;
        }
        .eq-bar-1 { animation: soundWave 0.6s infinite ease-in-out; }
        .eq-bar-2 { animation: soundWave 0.4s infinite 0.15s ease-in-out; }
        .eq-bar-3 { animation: soundWave 0.8s infinite 0.3s ease-in-out; }
      `}} />

      {/* Global Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            zIndex: 10000,
            maxWidth: '360px',
            width: '90%',
            backgroundColor: toast.type === 'error' ? colors.errorRedGlow : toast.type === 'success' ? colors.primaryGreenGlow : 'rgba(27, 27, 34, 0.96)',
            border: `1.5px solid ${toast.type === 'error' ? colors.errorRed : toast.type === 'success' ? colors.primaryGreen : colors.textGray}`,
            borderRadius: '18px',
            padding: '14px 20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(24px)',
            animation: 'fadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          <span style={{ fontSize: '20px' }}>
            {toast.type === 'error' ? '⚡' : toast.type === 'success' ? '🎉' : '🛰️'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#FFF', lineHeight: '1.4' }}>
            {toast.message}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP DESKTOP HEADER & CONTROLLER DASHBOARD BAR */}
      {/* ========================================================================= */}
      <div
        className="neon-card"
        style={{
          width: '100%',
          maxWidth: '860px',
          backgroundColor: '#0F0F13CC',
          borderRadius: '20px',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.primaryGreen, boxShadow: `0 0 10px ${colors.primaryGreen}` }}></div>
          <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.8px', color: colors.primaryGreen, textTransform: 'uppercase' }}>
            STIKBOOK LABS MOCKUP
          </span>
        </div>

        {/* Center Simulation controls (Dev Tools) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: colors.textGray, textTransform: 'uppercase', marginRight: '4px' }}>
            🛠️ Dev Tools:
          </span>
          <button
            onClick={() => handleDevAddCoins(100)}
            className="btn-premium"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '10px',
              color: colors.goldLight,
              fontWeight: 'bold'
            }}
          >
            🪙 +100 SC
          </button>
          <button
            onClick={handleDevResetAll}
            className="btn-premium"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              border: `1px solid ${colors.errorRed}33`,
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '10px',
              color: colors.errorRed,
              fontWeight: 'bold'
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Right audio controllers and audio waveforms */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Waveform EQ */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px', width: '15px' }}>
            <span className={`eq-bar eq-bar-1`} style={{ animationPlayState: !muted && isAudioVisualizing ? 'running' : 'paused', opacity: muted ? 0.2 : 0.8 }} />
            <span className={`eq-bar eq-bar-2`} style={{ animationPlayState: !muted && isAudioVisualizing ? 'running' : 'paused', opacity: muted ? 0.2 : 0.8 }} />
            <span className={`eq-bar eq-bar-3`} style={{ animationPlayState: !muted && isAudioVisualizing ? 'running' : 'paused', opacity: muted ? 0.2 : 0.8 }} />
          </div>
          
          <button
            onClick={() => {
              const nextMute = !muted;
              setMuted(nextMute);
              if (!nextMute) {
                playSound('coin', false);
              }
            }}
            className="btn-premium"
            style={{
              background: 'none',
              border: 'none',
              color: colors.textGray,
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{muted ? '🔇 Muted' : '🔊 Chimes'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DUAL SIMULATOR LAYOUT (SCALING HEIGHT TO PREVENT CUTOFFS) */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(370px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        
        {/* ========================================================================= */}
        {/* PHONE 1: STIKBOOK CUSTOMER WALLET & REDEEM PAGE */}
        {/* ========================================================================= */}
        <div
          className="neon-card"
          style={{
            backgroundColor: colors.surface,
            borderRadius: '40px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 2px 2px rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            // Dynamic viewport relative heights with caps to prevent layout cutoffs!
            height: 'calc(100vh - 160px)',
            minHeight: '530px',
            maxHeight: '740px'
          }}
        >
          {/* Phone Speaker Notch */}
          <div style={{ width: '120px', height: '22px', backgroundColor: '#000', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 'calc(50% - 60px)', zIndex: 100 }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#333', borderRadius: '2px' }}></div>
          </div>

          {/* Customer App Top Header */}
          <div
            style={{
              padding: '34px 20px 14px 20px',
              backgroundColor: '#0F0F13',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Stikbook</span>
                <span style={{ fontSize: '9px', backgroundColor: colors.primaryGreenGlow, color: colors.primaryGreen, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>WALLET</span>
              </div>
              <span style={{ fontSize: '10px', color: colors.textGray }}>Premium Redeem Hub</span>
            </div>

            {/* User Icon */}
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: colors.surfaceLight, border: `1.5px solid ${colors.primaryGreen}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13px' }}>
              👦
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COIN BALANCE DISPLAY SECTION */}
          {/* ========================================================================= */}
          <div
            onClick={() => setActiveTab('claim')} // Clicking balance takes you directly to Claim Daily login
            className="btn-premium"
            style={{
              margin: '12px 14px 10px 14px',
              padding: '12px 16px',
              backgroundColor: '#191922',
              borderRadius: '20px',
              border: `1px solid ${activeTab === 'claim' ? colors.primaryGreen : colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <WingedCoinIcon size={38} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: colors.textGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Available Balance
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#FFF', fontFamily: fonts.handwritten, lineHeight: 1 }}>
                    {balance}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: colors.primaryGreen }}>
                    SC
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Rewards Claim CTA */}
            {!dailyClaimed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '9px', backgroundColor: colors.gold, color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold', animation: 'float 2s infinite' }}>
                  +10 SC Free
                </span>
                <span style={{ fontSize: '8px', color: colors.textGray }}>Claim daily</span>
              </div>
            ) : (
              <span style={{ fontSize: '10px', color: colors.primaryGreen, fontWeight: '500' }}>✓ Streak Active</span>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB BAR NAVIGATION */}
          {/* ========================================================================= */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0F0F13',
              padding: '4px',
              margin: '0 14px 10px 14px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              position: 'relative'
            }}
          >
            <button
              onClick={() => { setActiveTab('redeem'); playSoundEffect('scan'); }}
              className="btn-premium"
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: activeTab === 'redeem' ? colors.primaryGreen : colors.textGray,
                fontWeight: 'bold',
                fontSize: '11px',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🗺️ Redeem
            </button>
            <button
              onClick={() => { setActiveTab('activity'); playSoundEffect('scan'); }}
              className="btn-premium"
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: activeTab === 'activity' ? colors.primaryGreen : colors.textGray,
                fontWeight: 'bold',
                fontSize: '11px',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🕒 Ledger
            </button>
            <button
              onClick={() => { setActiveTab('claim'); playSoundEffect('scan'); }}
              className="btn-premium"
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: activeTab === 'claim' ? colors.primaryGreen : colors.textGray,
                fontWeight: 'bold',
                fontSize: '11px',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🎁 Claim
            </button>

            {/* Sliding Tab Highlight background */}
            <div
              style={{
                position: 'absolute',
                top: '4px',
                bottom: '4px',
                left: activeTab === 'redeem' ? '4px' : activeTab === 'activity' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 1px)',
                width: 'calc(33.33% - 6px)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                zIndex: 1
              }}
            />
          </div>

          {/* ========================================================================= */}
          {/* SCROLLABLE SCENE PANEL CONTAINER */}
          {/* ========================================================================= */}
          <div
            className="custom-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 14px 16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >

            {/* TAB CONTENT: REDEEM /GPS FINDER SHOP LIST */}
            {activeTab === 'redeem' && (
              <>
                {/* 1. MOCK GPS NEON RADAR PANEL */}
                <div
                  style={{
                    backgroundColor: '#0F0F13',
                    borderRadius: '20px',
                    border: `1.5px dashed ${isDrifting ? colors.primaryGreen : 'rgba(255, 255, 255, 0.08)'}`,
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Sweep Glow */}
                  {isDrifting && (
                    <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${colors.primaryGreenGlow} 0%, transparent 70%)` }}></div>
                  )}

                  {/* Header controllers for Radar */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isRadarCollapsed ? '0px' : '8px', zIndex: 5 }}>
                    <span
                      onClick={() => setIsRadarCollapsed(!isRadarCollapsed)}
                      className="btn-premium"
                      style={{ fontSize: '10px', color: colors.textGray, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.primaryGreen, display: 'inline-block', animation: 'locationPulse 2s infinite' }}></span>
                      GPS Satellite Radar {isRadarCollapsed ? '(Collapsed)' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {/* Collapse Toggle Icon */}
                      <button
                        onClick={() => { setIsRadarCollapsed(!isRadarCollapsed); playSoundEffect('scan'); }}
                        className="btn-premium"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          color: colors.textWhite,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isRadarCollapsed ? '👁️ Expand' : '📁 Collapse'}
                      </button>
                      <button
                        onClick={toggleRealGPS}
                        className="btn-premium"
                        style={{
                          backgroundColor: useRealGPS ? colors.primaryGreen : '#191922',
                          color: useRealGPS ? '#000' : colors.textWhite,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}
                      >
                        {useRealGPS ? '📍 Live' : '🛰️ Custom'}
                      </button>
                      <button
                        onClick={triggerSimulatedDrift}
                        disabled={isDrifting}
                        className="btn-premium"
                        style={{
                          backgroundColor: colors.surfaceLight,
                          color: colors.primaryGreen,
                          border: `1px solid ${colors.primaryGreen}44`,
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isDrifting ? 'Drifting...' : '🛰️ Drift'}
                      </button>
                    </div>
                  </div>

                  {/* HIGH-TECH RADAR MAP GRAPHIC (COLLAPSIBLE FOR UX SPACE) */}
                  {!isRadarCollapsed && (
                    <div style={{ position: 'relative', width: '150px', height: '150px', margin: '4px 0', animation: 'fadeIn 0.2s ease-out' }}>
                      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}>
                        {/* Grid concentric circles */}
                        <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(74, 222, 128, 0.05)" strokeWidth="1.5" />
                        <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(74, 222, 128, 0.05)" strokeWidth="1" />

                        {/* Crosshairs lines */}
                        <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                        {/* Moving radar sweep scan line */}
                        <g className="radar-line" style={{ animationPlayState: isDrifting ? 'running' : 'running' }}>
                          <line x1="100" y1="100" x2="100" y2="5" stroke={colors.primaryGreen} strokeWidth="1.5" opacity="0.6" />
                          <polygon points="100,100 100,5 60,15" fill="url(#radarGradient)" opacity="0.15" />
                        </g>

                        <defs>
                          <linearGradient id="radarGradient" x1="1" y1="0.5" x2="0" y2="0.5">
                            <stop offset="0%" stopColor={colors.primaryGreen} stopOpacity="1" />
                            <stop offset="100%" stopColor={colors.primaryGreen} stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* MAPPED SHOP PIN MARKERS */}
                        {liveShops.map((shop) => {
                          const scale = 0.026;
                          const dx = (shop.baseLng - userCoords.lng) * 111320;
                          const dy = (shop.baseLat - userCoords.lat) * 110540;
                          
                          let x = 100 + dx * scale;
                          let y = 100 - dy * scale;
                          
                          const distanceCenter = Math.sqrt((x-100)*(x-100) + (y-100)*(y-100));
                          if (distanceCenter > 88) {
                            const angle = Math.atan2(y-100, x-100);
                            x = 100 + Math.cos(angle) * 88;
                            y = 100 + Math.sin(angle) * 88;
                          }

                          const isSelected = selectedShop?.id === shop.id;

                          return (
                            <g
                              key={shop.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedShop(shop);
                                playSoundEffect('scan');
                                showToast(`🏪 Selected: ${shop.name}. Tap products below to redeem!`, 'info');
                              }}
                            >
                              <circle cx={x} cy={y} r={isSelected ? "11" : "7"} fill={shop.color} opacity={isSelected ? "0.35" : "0.15"} style={{ transition: 'all 0.3s' }} />
                              <circle cx={x} cy={y} r={isSelected ? "7" : "4.5"} fill={shop.color} stroke="#FFFFFF" strokeWidth="1" style={{ transition: 'all 0.3s' }} />
                              
                              <text x={x + 6} y={y - 6} fill="#FFF" style={{ fontSize: '9px', fontWeight: 'bold', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
                                {shop.icon}
                              </text>
                            </g>
                          );
                        })}

                        {/* Pulsing center Location Dot */}
                        <circle cx="100" cy="100" r="5" fill="#60A5FA" stroke="#FFF" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 6px #60A5FA)' }} />
                      </svg>
                    </div>
                  )}

                  <span style={{ fontSize: '9px', color: colors.textGray, textAlign: 'center', marginTop: isRadarCollapsed ? '0px' : '4px' }}>
                    🛰️ Center: <span style={{ color: '#60A5FA', fontWeight: 'bold' }}>My Location</span>. Click marker pins or list cards below to browse catalogs.
                  </span>
                </div>

                {/* 2. LIVE SHOPS LIST HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🏪 Registered Outlets ({liveShops.length})
                  </span>
                  <span style={{ fontSize: '9px', color: colors.primaryGreen, fontWeight: 'bold' }}>
                    Live GPS Distances
                  </span>
                </div>

                {/* 3. SCROLLABLE SHORE LIST CARDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {liveShops.map((shop) => {
                    const isSelected = selectedShop?.id === shop.id;
                    return (
                      <div
                        key={shop.id}
                        onClick={() => {
                          setSelectedShop(isSelected ? null : shop);
                          playSoundEffect('scan');
                        }}
                        className="btn-premium neon-glow-hover"
                        style={{
                          backgroundColor: isSelected ? '#161F1A' : '#121217',
                          borderRadius: '16px',
                          border: `1.5px solid ${isSelected ? colors.primaryGreen : colors.border}`,
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: `${shop.color}12`,
                              border: `1px solid ${shop.color}30`,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '18px'
                            }}
                          >
                            {shop.icon}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFF' }}>
                              {shop.name}
                            </span>
                            <span style={{ fontSize: '9px', color: colors.textGray }}>
                              {shop.type.split(' & ')[0]}
                            </span>
                            <span style={{ fontSize: '8px', color: colors.primaryGreen, fontWeight: 'bold', marginTop: '1px' }}>
                              ⭐ {shop.rating} • {shop.products.length} Items
                            </span>
                          </div>
                        </div>

                        {/* Distance GPS */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: colors.primaryGreen }}>
                            {shop.distance}m
                          </span>
                          <span style={{ fontSize: '8px', color: colors.textGray }}>
                            away
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB CONTENT: PAST TRANSACTION ACTIVITY */}
            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  🕒 Wallet Ledger History
                </span>
                
                {transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: colors.textGray }}>
                    <span style={{ fontSize: '24px' }}>📭</span>
                    <p style={{ fontSize: '10px', margin: '4px 0 0 0' }}>No coin logs found.</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#121217',
                        border: `1.5px solid ${colors.border}`,
                        borderRadius: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: tx.type === 'redeem' ? colors.errorRedGlow : colors.primaryGreenGlow,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '14px'
                          }}
                        >
                          {tx.type === 'redeem' ? '🛒' : '🎁'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FFF' }}>
                            {tx.title}
                          </span>
                          <span style={{ fontSize: '8px', color: colors.textGray }}>
                            🏪 {tx.shopName.split(' ')[0]} • {tx.date}
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color: tx.type === 'redeem' ? colors.errorRed : colors.primaryGreen
                        }}
                      >
                        {tx.type === 'redeem' ? '-' : '+'}{tx.amount} SC
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: CLAIM REWARD DRAWER */}
            {activeTab === 'claim' && (
              <div
                style={{
                  padding: '20px 16px',
                  backgroundColor: '#121217',
                  borderRadius: '20px',
                  border: `1px solid ${colors.border}`,
                  textAlign: 'center',
                  animation: 'fadeIn 0.2s ease-out',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <WingedCoinIcon size={52} />
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold' }}>Streak Check-In</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: colors.textGray, lineHeight: '1.4' }}>
                    Open your wallet daily to claim +10 free coins.
                  </p>
                </div>

                <button
                  onClick={handleClaimDailyLogin}
                  disabled={dailyClaimed}
                  className="btn-premium"
                  style={{
                    width: '100%',
                    backgroundColor: dailyClaimed ? '#1E1E26' : colors.primaryGreen,
                    color: dailyClaimed ? colors.textGray : '#000',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    boxShadow: dailyClaimed ? 'none' : `0 4px 14px rgba(74, 222, 128, 0.2)`
                  }}
                >
                  {dailyClaimed ? '✓ Daily Bonus Claimed (+10 SC)' : '🎁 Claim Login Bonus (+10 SC)'}
                </button>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* BOTTOM SHEET / PRODUCTS CATALOG SHEET OVERLAY (RESPONSIVE HEIGHTS) */}
          {/* ========================================================================= */}
          {selectedShop && !pendingRedeem && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#0F0F13',
                borderTop: '2px solid rgba(255, 255, 255, 0.08)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '16px',
                boxShadow: '0 -16px 40px rgba(0, 0, 0, 0.7)',
                zIndex: 100,
                animation: 'fadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                // Scale height to prevent covering notch or exceeding phone height
                maxHeight: '75%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Handle bar */}
              <div style={{ width: '36px', height: '4px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 12px auto', cursor: 'pointer' }} onClick={() => setSelectedShop(null)}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#FFF' }}>
                    {selectedShop.icon} {selectedShop.name}
                  </h3>
                  <span style={{ fontSize: '9px', color: colors.textGray }}>
                    Browse catalog shelves below
                  </span>
                </div>
                <button
                  onClick={() => setSelectedShop(null)}
                  className="btn-premium"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: colors.textGray,
                    fontSize: '10px'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Product Shelf Grid */}
              <div
                className="custom-scroll"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '2px'
                }}
              >
                {selectedShop.products.map((product) => {
                  const hasEnough = balance >= product.price;
                  return (
                    <div
                      key={product.id}
                      style={{
                        padding: '10px',
                        backgroundColor: '#121217',
                        border: '1.5px solid rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px' }}>{product.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FFF' }}>
                            {product.name}
                          </span>
                          <span style={{ fontSize: '9px', color: colors.textGray, maxWidth: '170px', lineHeight: '1.2' }}>
                            {product.desc}
                          </span>
                        </div>
                      </div>

                      {/* Product Redeem button */}
                      <button
                        onClick={() => handleRedeemClick(selectedShop, product)}
                        className="btn-premium"
                        style={{
                          backgroundColor: hasEnough ? colors.primaryGreenGlow : colors.errorRedGlow,
                          color: hasEnough ? colors.primaryGreen : colors.errorRed,
                          border: `1px solid ${hasEnough ? colors.primaryGreen : colors.errorRed}`,
                          borderRadius: '10px',
                          padding: '6px 10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>🎫 {product.price} SC</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* USER QR CODE & OTP SHOW PRESENTATION (SCREEN OVERLAY) */}
          {/* ========================================================================= */}
          {pendingRedeem && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.surface,
                padding: '36px 20px 20px 20px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'fadeIn 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              {/* Top Navigation */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: colors.primaryGreen, letterSpacing: '0.5px' }}>
                  ⚡ ACTIVE REDEMPTION SECURE
                </span>
                <button
                  onClick={() => { setPendingRedeem(null); playSoundEffect('scan'); }}
                  className="btn-premium"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '10px',
                    color: colors.textWhite
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* Order Detail Summary */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ fontSize: '9px', color: colors.textGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Walk to Counter at
                </span>
                <h3 style={{ margin: '2px 0', fontSize: '15px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pendingRedeem.shop.icon} {pendingRedeem.shop.name}
                </h3>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '5px 12px', borderRadius: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '15px' }}>{pendingRedeem.product.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{pendingRedeem.product.name}</span>
                  <span style={{ fontSize: '9px', color: colors.primaryGreen, backgroundColor: colors.primaryGreenGlow, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {pendingRedeem.product.price} SC
                  </span>
                </div>
              </div>

              {/* DYNAMIC BARCODE/QR SIMULATION (FIT DYNAMIC VIEWPORT) */}
              <div
                style={{
                  backgroundColor: '#FFF',
                  padding: '12px',
                  borderRadius: '18px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative'
                }}
              >
                {/* SVG Mock QR Code */}
                <svg viewBox="0 0 100 100" style={{ width: '110px', height: '110px' }}>
                  <rect x="0" y="0" width="25" height="25" fill="#000" />
                  <rect x="5" y="5" width="15" height="15" fill="#FFF" />
                  <rect x="8" y="8" width="9" height="9" fill="#000" />

                  <rect x="75" y="0" width="25" height="25" fill="#000" />
                  <rect x="80" y="5" width="15" height="15" fill="#FFF" />
                  <rect x="83" y="8" width="9" height="9" fill="#000" />

                  <rect x="0" y="75" width="25" height="25" fill="#000" />
                  <rect x="5" y="80" width="15" height="15" fill="#FFF" />
                  <rect x="8" y="83" width="9" height="9" fill="#000" />

                  <rect x="35" y="10" width="10" height="5" fill="#000" />
                  <rect x="50" y="5" width="5" height="20" fill="#000" />
                  <rect x="40" y="25" width="15" height="10" fill="#000" />
                  <rect x="65" y="30" width="15" height="5" fill="#000" />

                  <rect x="10" y="40" width="15" height="10" fill="#000" />
                  <rect x="30" y="45" width="25" height="5" fill="#000" />
                  <rect x="15" y="60" width="10" height="10" fill="#000" />

                  <rect x="40" y="60" width="15" height="20" fill="#000" />
                  <rect x="65" y="65" width="5" height="15" fill="#000" />
                  <rect x="85" y="45" width="10" height="10" fill="#000" />
                  
                  <rect x="60" y="80" width="25" height="5" fill="#000" />
                  <rect x="70" y="90" width="15" height="5" fill="#000" />
                  <rect x="35" y="85" width="15" height="10" fill="#000" />
                </svg>

                <span style={{ fontSize: '8px', color: '#666', fontWeight: 'bold', letterSpacing: '1px' }}>
                  STIKBOOK SCAN SECURE
                </span>
              </div>

              {/* OTP CODE PIN PANEL */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ fontSize: '10px', color: colors.textGray, textTransform: 'uppercase' }}>
                  Or Share 6-Digit OTP
                </span>
                
                {/* Glowing OTP display boxes */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', margin: '6px 0' }}>
                  {pendingRedeem.otp.split('-').join('').split('').map((char, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '28px',
                        height: '36px',
                        backgroundColor: '#1E1E26',
                        border: `1.5px solid ${colors.primaryGreen}`,
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '15px',
                        fontWeight: '800',
                        color: colors.primaryGreen,
                        boxShadow: `0 0 8px rgba(74, 222, 128, 0.12)`
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated Countdown Timer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.gold, animation: 'float 1.5s infinite' }}></div>
                <span style={{ fontSize: '10px', color: colors.textGray }}>
                  Expires in: <span style={{ color: colors.gold, fontWeight: 'bold' }}>{formatTime(otpTimer)}</span>
                </span>
              </div>

              <span style={{ fontSize: '8px', color: colors.textGray, textAlign: 'center', lineHeight: '1.3' }}>
                Show this screen to the merchant. They scan QR or enter OTP to finalize token check.
              </span>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* PHONE 2: STIKBOOK PARTNER APP (SHOPKEEPER SCREEN SIMULATOR) */}
        {/* ========================================================================= */}
        <div
          className="neon-card"
          style={{
            backgroundColor: '#0F0F14',
            borderRadius: '40px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 2px 2px rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            // Matching Left phone frame height perfectly!
            height: 'calc(100vh - 160px)',
            minHeight: '530px',
            maxHeight: '740px'
          }}
        >
          {/* Speaker Notch */}
          <div style={{ width: '120px', height: '22px', backgroundColor: '#000', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 'calc(50% - 60px)', zIndex: 100 }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#333', borderRadius: '2px' }}></div>
          </div>

          {/* Shopkeeper App Header */}
          <div
            style={{
              padding: '34px 20px 14px 20px',
              backgroundColor: '#1E1E26',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: colors.goldLight }}>Stikbook Partner</span>
                <span style={{ fontSize: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: colors.gold, padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>MERCHANT</span>
              </div>
              <span style={{ fontSize: '10px', color: colors.textGray }}>Simulated cashier terminal</span>
            </div>

            <span style={{ fontSize: '9px', color: colors.textGray, backgroundColor: 'rgba(255,255,255,0.04)', padding: '3px 6px', borderRadius: '5px' }}>
              #9432-COIN
            </span>
          </div>

          {/* Select Active Merchant Dropdown for Demo */}
          <div style={{ padding: '10px 14px 4px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '9px', color: colors.textGray, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🏪 Simulation Terminal Shop:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {initialShops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => {
                    setShopkeeperShopId(shop.id);
                    playSoundEffect('scan');
                    if (pendingRedeem && pendingRedeem.shop.id !== shop.id) {
                      showToast(`⚠️ Terminal changed to ${shop.name}. Order was generated for ${pendingRedeem.shop.name}.`, 'error');
                    }
                  }}
                  className="btn-premium"
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    backgroundColor: shopkeeperShopId === shop.id ? colors.gold : 'rgba(255,255,255,0.03)',
                    color: shopkeeperShopId === shop.id ? '#000' : colors.textWhite,
                    border: shopkeeperShopId === shop.id ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{shop.icon}</span>
                  <span style={{ fontSize: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%' }}>{shop.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Screen Body Area */}
          <div
            style={{
              flex: 1,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '12px',
              overflow: 'hidden'
            }}
          >
            
            {/* NO ACTIVE SIGNALS STATE */}
            {!pendingRedeem && (
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#131317',
                  border: '1.5px dashed rgba(255,255,255,0.06)',
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '8px'
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', animation: 'float 3s infinite' }}>
                  📡
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '12px', fontWeight: 'bold' }}>Awaiting Broadcast Signal</h4>
                  <p style={{ margin: 0, fontSize: '10px', color: colors.textGray, lineHeight: '1.4' }}>
                    Select a product and tap <strong style={{ color: colors.primaryGreen }}>Redeem</strong> on the User Wallet app (Left Phone) to broadcast code coordinates!
                  </p>
                </div>
              </div>
            )}

            {/* SCANNING RADAR/CAMERA ACTIVE ANIMATOR OVERLAY */}
            {pendingRedeem && isScanning && (
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#000',
                  borderRadius: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: `2px solid ${colors.gold}`
                }}
              >
                {/* Laser Line */}
                <div
                  className="laser-sweep"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    backgroundColor: colors.gold,
                    boxShadow: `0 0 10px 3px ${colors.gold}`,
                    zIndex: 50
                  }}
                />

                {/* Simulated Viewfinder */}
                <div style={{ border: `2px solid ${colors.gold}60`, width: '130px', height: '130px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: '0.45', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', borderTop: '2px solid #FFF', borderLeft: '2px solid #FFF' }}></div>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderTop: '2px solid #FFF', borderRight: '2px solid #FFF' }}></div>
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '16px', height: '16px', borderBottom: '2px solid #FFF', borderLeft: '2px solid #FFF' }}></div>
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', borderBottom: '2px solid #FFF', borderRight: '2px solid #FFF' }}></div>
                  <svg viewBox="0 0 100 100" style={{ width: '60px', height: '60px', fill: '#FFF' }}>
                    <rect x="0" y="0" width="20" height="20" />
                    <rect x="80" y="0" width="20" height="20" />
                    <rect x="0" y="80" width="20" height="20" />
                    <rect x="40" y="40" width="20" height="20" />
                  </svg>
                </div>
                
                <span style={{ fontSize: '10px', color: colors.gold, fontWeight: 'bold', marginTop: '12px', zIndex: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  📷 SIMULATING SCANNER CAPTURE...
                </span>
              </div>
            )}

            {/* PENDING REDEMPTION SIGNAL DETECTED IN TERMINAL */}
            {pendingRedeem && !isScanning && (
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#121217',
                  border: `1.5px solid ${pendingRedeem.shop.id === shopkeeperShopId ? colors.gold : 'rgba(255, 255, 255, 0.05)'}`,
                  borderRadius: '20px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  animation: 'fadeIn 0.2s ease-out',
                  overflowY: 'auto'
                }}
              >
                {/* Header Signal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.gold, animation: 'float 1s infinite' }}></span>
                    <span style={{ fontSize: '10px', color: colors.gold, fontWeight: 'bold', textTransform: 'uppercase' }}>
                      Broadcasting Incoming
                    </span>
                  </div>
                  <span style={{ fontSize: '8px', color: colors.textGray }}>
                    Secure POS Check
                  </span>
                </div>

                {/* Warning mismatch with Quick Auto Align terminal utility! */}
                {pendingRedeem.shop.id !== shopkeeperShopId ? (
                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: colors.errorRedGlow,
                      border: `1px solid ${colors.errorRed}`,
                      borderRadius: '10px',
                      fontSize: '9px',
                      color: '#FFF',
                      lineHeight: '1.4',
                      margin: '6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div>
                      ⚠️ <strong>Terminal Mismatch!</strong> Order belongs to <strong>{pendingRedeem.shop.name}</strong>.
                    </div>
                    <button
                      onClick={() => {
                        setShopkeeperShopId(pendingRedeem.shop.id);
                        playSoundEffect('success');
                        showToast(`⚡ POS terminal synced with ${pendingRedeem.shop.name}!`, 'success');
                      }}
                      className="btn-premium"
                      style={{
                        backgroundColor: '#FFF',
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}
                    >
                      ⚡ Auto-Sync POS Terminal
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'rgba(74, 222, 128, 0.05)',
                      border: `1px solid ${colors.primaryGreen}33`,
                      borderRadius: '8px',
                      fontSize: '9px',
                      color: colors.primaryGreen,
                      margin: '6px 0'
                    }}
                  >
                    ✓ POS Terminal synchronized with Customer purchase channel!
                  </div>
                )}

                {/* Customer Request Details card */}
                <div style={{ backgroundColor: '#1E1E26', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', margin: '4px 0' }}>
                  <span style={{ fontSize: '8px', color: colors.textGray, textTransform: 'uppercase' }}>Secure Customer</span>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '1px', color: '#FFF' }}>Stikbook User (#USER-832)</div>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>{pendingRedeem.product.icon}</span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#FFF' }}>{pendingRedeem.product.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: colors.gold }}>
                      {pendingRedeem.product.price} SC
                    </span>
                  </div>
                </div>

                {/* Option A: Quick Camera scan simulator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleShopkeeperApprove('qr')}
                    disabled={pendingRedeem.shop.id !== shopkeeperShopId}
                    className="btn-premium"
                    style={{
                      width: '100%',
                      backgroundColor: colors.gold,
                      color: '#000',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 3px 10px rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    📷 Scan Customer QR Code
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}></div>
                    <span style={{ fontSize: '8px', color: colors.textGray, padding: '0 6px', textTransform: 'uppercase' }}>
                      Or OTP
                    </span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}></div>
                  </div>

                  {/* Option B: Enter manual OTP input panel */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Enter OTP (or autofill)"
                        value={manualOtpInput}
                        onChange={(e) => setManualOtpInput(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E1E26',
                          border: `1px solid ${manualOtpInput ? colors.gold : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '10px',
                          padding: '8px 46px 8px 10px',
                          color: '#FFF',
                          fontSize: '10px',
                          boxSizing: 'border-box'
                        }}
                      />
                      {/* Autofill helper */}
                      <button
                        onClick={() => {
                          setManualOtpInput(pendingRedeem.otp);
                          playSoundEffect('scan');
                        }}
                        style={{
                          position: 'absolute',
                          right: '5px',
                          top: '5px',
                          bottom: '5px',
                          backgroundColor: colors.surfaceLight,
                          border: 'none',
                          color: colors.gold,
                          borderRadius: '6px',
                          fontSize: '8px',
                          padding: '0 6px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Autofill
                      </button>
                    </div>

                    <button
                      onClick={() => handleShopkeeperApprove('otp')}
                      disabled={pendingRedeem.shop.id !== shopkeeperShopId}
                      className="btn-premium"
                      style={{
                        backgroundColor: '#1E1E26',
                        color: colors.gold,
                        border: `1px solid ${colors.gold}`,
                        borderRadius: '10px',
                        padding: '0 12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <span style={{ fontSize: '8px', color: colors.textGray, textAlign: 'center', marginTop: '4px' }}>
                  *Click QR Button to trigger optical scanner mockup. Use OTP fields for manual checkout counters.
                </span>
              </div>
            )}

          </div>

          {/* Shopkeeper Terminal Bottom Branding */}
          <div style={{ backgroundColor: '#131317', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: colors.textGray }}>
              🔒 Protected by Stik-Block secure transaction protocols
            </span>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* TRANSACTION REDEEM SUCCESS FULLSCREEN TAKEOVER MODAL */}
      {/* ========================================================================= */}
      {showRedeemSuccessModal && lastRedeemedProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(8, 8, 10, 0.96)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          {/* Confetti Particle Sparkles Background */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
            <div className="sparkle-particle" style={{ left: '15%', top: '60%', animationDelay: '0s' }}></div>
            <div className="sparkle-particle" style={{ left: '30%', top: '70%', animationDelay: '0.5s', backgroundColor: colors.gold }}></div>
            <div className="sparkle-particle" style={{ left: '45%', top: '55%', animationDelay: '0.2s' }}></div>
            <div className="sparkle-particle" style={{ left: '60%', top: '80%', animationDelay: '0.8s', backgroundColor: colors.gold }}></div>
            <div className="sparkle-particle" style={{ left: '75%', top: '65%', animationDelay: '0.4s' }}></div>
            <div className="sparkle-particle" style={{ left: '85%', top: '50%', animationDelay: '1s', backgroundColor: colors.gold }}></div>
          </div>

          <div
            className="neon-card"
            style={{
              backgroundColor: '#121217',
              border: `2px solid ${colors.primaryGreen}`,
              borderRadius: '28px',
              padding: '30px 20px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: `0 20px 50px rgba(74, 222, 128, 0.12)`,
              position: 'relative',
              zIndex: 1010
            }}
          >
            {/* Big checkmark */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: colors.primaryGreenGlow,
                border: `3px solid ${colors.primaryGreen}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '32px',
                margin: '0 auto 16px auto',
                animation: 'float 2s infinite'
              }}
            >
              ✓
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800', color: '#FFF' }}>
              Redemption Successful!
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: colors.textGray, lineHeight: '1.4' }}>
              Your secure Stikcoins purchase token has been scanned & approved by the merchant counter. Enjoy your item!
            </p>

            {/* Receipt Card */}
            <div
              style={{
                backgroundColor: '#1C1C24',
                borderRadius: '16px',
                padding: '14px',
                border: '1px dashed rgba(255,255,255,0.08)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: colors.textGray }}>REDEEMED ITEM:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FFF' }}>
                  {lastRedeemedProduct.icon} {lastRedeemedProduct.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: colors.textGray }}>MERCHANT OUTLET:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FFF' }}>
                  {lastRedeemedProduct.shop}
                </span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '2px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: colors.textGray }}>DEBIT AMOUNT:</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: colors.primaryGreen }}>
                  -{lastRedeemedProduct.price} SC
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowRedeemSuccessModal(false);
                playSoundEffect('coin');
              }}
              className="btn-premium"
              style={{
                width: '100%',
                backgroundColor: colors.primaryGreen,
                color: '#000',
                border: 'none',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '13px',
                fontWeight: 'bold',
                boxShadow: `0 4px 14px rgba(74, 222, 128, 0.2)`
              }}
            >
              🎉 Done - Walk Out with Product
            </button>
          </div>
        </div>
      )}

      {/* Simulator Quick Tips Footer */}
      <footer style={{ marginTop: '20px', textAlign: 'center', maxWidth: '650px', padding: '0 16px' }}>
        <p style={{ fontSize: '10px', color: colors.textGray, margin: 0, lineHeight: '1.5' }}>
          💡 <strong>Simulator Tip:</strong> The phone frames are designed to dynamically fit your viewport, with internal scrolls matching standard smart-devices. Need more coins to try the <strong>Bluetooth ANC Earbuds (500 SC)</strong> or <strong>Mechanical Keyboard (650 SC)</strong>? Tap the <strong style={{ color: colors.goldLight }}>🪙 +100 SC</strong> developer tool at the top to load up instantly!
        </p>
      </footer>

    </div>
  );
}
