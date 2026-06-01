import React, { useState } from 'react';
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
  border: 'rgba(255,255,255,0.07)',
  gray: '#94A3B8',
  white: '#FFFFFF',
  error: '#EF4444',
};

const ROLES = [
  {
    id: 'customer',
    label: 'Customer',
    subtitle: 'Redeem coins at nearby shops',
    icon: '👦',
    accent: C.green,
    email: 'aakash.srisai@gmail.com',
    password: 'demo123',
    badge: 'USER',
    badgeColor: C.green,
  },
  {
    id: 'shopkeeper',
    label: 'Shopkeeper',
    subtitle: 'Scan OTPs, approve orders',
    icon: '👩‍💼',
    accent: C.gold,
    email: 'akash.sai4491@gmail.com',
    password: 'demo123',
    badge: 'MERCHANT',
    badgeColor: C.gold,
  },
];

export default function LoginPage() {
  const { login, showToast, sfx } = useApp();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const role = ROLES.find(r => r.id === selectedRole);

  const handleDemoFill = () => {
    setEmail(role.email);
    setPassword(role.password);
    setError('');
    sfx('scan');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 700)); // Simulate auth latency

    const result = await login(selectedRole, password);
    if (result.ok) {
      showToast(`✅ Welcome back! Redirecting to ${role.label} dashboard...`, 'success');
      setTimeout(() => {
        navigate(selectedRole === 'customer' ? '/customer' : '/shopkeeper');
      }, 600);
    } else {
      setError(result.error || 'Login failed. Check credentials.');
      sfx('error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&family=Caveat:wght@700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-8px) rotate(2deg);} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        .btn-primary { transition: all 0.15s ease; cursor:pointer; }
        .btn-primary:hover { opacity:0.93; transform:translateY(-1px); }
        .btn-primary:active { transform:scale(0.97); }
        .role-card { transition: all 0.2s ease; cursor:pointer; }
        .role-card:hover { border-color: rgba(255,255,255,0.15) !important; }
        .input-field:focus { outline:none; border-color: ${C.green} !important; box-shadow: 0 0 0 3px ${C.greenGlow}; }
      `}</style>

      {/* Animated background blobs */}
      <div style={{ position:'absolute', top:'-10%', left:'-10%', width:'40vw', height:'40vw', maxWidth:'480px', maxHeight:'480px', borderRadius:'50%', background:'radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', maxWidth:'560px', maxHeight:'560px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'420px', animation:'fadeUp 0.4s ease-out' }}>

        {/* Brand Mark */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          {/* Winged Coin Logo */}
          <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:C.gold, border:`3px solid ${C.goldLight}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', animation:'float 3s ease-in-out infinite', boxShadow:'0 8px 24px rgba(245,158,11,0.3)' }}>
            <svg viewBox="0 0 100 100" style={{ width:'85%', height:'85%' }}>
              <path d="M 28 48 C 12 40, 10 25, 22 18 C 30 25, 30 38, 38 42 Z" fill={C.goldLight} opacity="0.9" />
              <path d="M 72 48 C 88 40, 90 25, 78 18 C 70 25, 70 38, 62 42 Z" fill={C.goldLight} opacity="0.9" />
              <circle cx="50" cy="50" r="32" fill={C.gold} stroke={C.goldLight} strokeWidth="2.5" />
              <text x="50" y="58" textAnchor="middle" fill="#FFF" style={{ fontSize:'48px', fontWeight:'900', fontFamily:'Caveat, cursive' }}>S</text>
            </svg>
          </div>
          <h1 style={{ margin:'0 0 4px 0', fontSize:'28px', fontWeight:'900', color:C.white }}>
            Stikbook
          </h1>
          <p style={{ margin:0, fontSize:'13px', color:C.gray }}>
            Rewards Wallet & Partner Platform
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: C.surface,
          borderRadius:'28px',
          border:`1.5px solid ${C.border}`,
          padding:'28px',
          boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
        }}>

          {/* Role Selector */}
          <p style={{ margin:'0 0 12px 0', fontSize:'11px', color:C.gray, fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.8px' }}>
            Choose your role
          </p>
          <div style={{ display:'flex', gap:'10px', marginBottom:'24px' }}>
            {ROLES.map(r => (
              <button
                key={r.id}
                className="role-card"
                onClick={() => { setSelectedRole(r.id); setEmail(''); setPassword(''); setError(''); sfx('scan'); }}
                style={{
                  flex:1, padding:'14px 10px', background:'none',
                  backgroundColor: selectedRole === r.id ? `${r.accent}12` : C.surfaceLight,
                  border:`1.5px solid ${selectedRole === r.id ? r.accent : 'rgba(255,255,255,0.05)'}`,
                  borderRadius:'16px', textAlign:'center', cursor:'pointer',
                  boxShadow: selectedRole === r.id ? `0 4px 16px ${r.accent}1A` : 'none',
                }}
              >
                <div style={{ fontSize:'24px', marginBottom:'4px' }}>{r.icon}</div>
                <div style={{ fontSize:'12px', fontWeight:'800', color: selectedRole === r.id ? r.accent : C.white }}>
                  {r.label}
                </div>
                <div style={{ fontSize:'9px', color:C.gray, marginTop:'2px', lineHeight:'1.3' }}>
                  {r.subtitle}
                </div>
              </button>
            ))}
          </div>

          {/* Demo Credentials Banner */}
          <div style={{
            backgroundColor: `${role.accent}0D`,
            border:`1px solid ${role.accent}30`,
            borderRadius:'12px', padding:'12px 16px',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:'20px',
          }}>
            <div>
              <div style={{ fontSize:'10px', color:C.gray, fontWeight:'bold', textTransform:'uppercase' }}>Demo Login</div>
              <div style={{ fontSize:'11px', color:C.white, marginTop:'2px', fontFamily:'monospace' }}>
                {role.email}
              </div>
              <div style={{ fontSize:'11px', color:C.gray, fontFamily:'monospace' }}>
                pwd: <span style={{ color:role.accent }}>{role.password}</span>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleDemoFill}
              style={{
                backgroundColor: role.accent, color:'#000',
                border:'none', borderRadius:'10px',
                padding:'8px 14px', fontSize:'11px', fontWeight:'bold',
              }}
            >
              Auto-Fill
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'11px', color:C.gray, fontWeight:'bold', display:'block', marginBottom:'6px', textTransform:'uppercase' }}>
                Email
              </label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role.email}
                required
                style={{
                  width:'100%', boxSizing:'border-box',
                  backgroundColor:'#0F0F13',
                  border:`1.5px solid ${C.border}`,
                  borderRadius:'12px', padding:'12px 14px',
                  color:C.white, fontSize:'13px',
                  transition:'all 0.2s',
                }}
              />
            </div>

            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'11px', color:C.gray, fontWeight:'bold', display:'block', marginBottom:'6px', textTransform:'uppercase' }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width:'100%', boxSizing:'border-box',
                    backgroundColor:'#0F0F13',
                    border:`1.5px solid ${C.border}`,
                    borderRadius:'12px', padding:'12px 42px 12px 14px',
                    color:C.white, fontSize:'13px',
                    transition:'all 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', color:C.gray, cursor:'pointer', fontSize:'16px',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor:'rgba(239,68,68,0.1)', border:`1px solid ${C.error}`,
                borderRadius:'10px', padding:'10px 14px',
                fontSize:'12px', color:C.error, marginBottom:'14px',
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width:'100%',
                backgroundColor: loading ? C.surfaceLight : role.accent,
                color: loading ? C.gray : '#000',
                border:'none', borderRadius:'14px',
                padding:'14px', fontSize:'14px', fontWeight:'bold',
                display:'flex', justifyContent:'center', alignItems:'center', gap:'8px',
                boxShadow: loading ? 'none' : `0 4px 18px ${role.accent}30`,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width:'16px', height:'16px', border:`2px solid ${C.gray}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                `${role.icon} Sign in as ${role.label}`
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p style={{ textAlign:'center', fontSize:'11px', color:'#374151', marginTop:'20px' }}>
          🔒 Stikbook Hybrid Labs · Demo Environment · No real transactions
        </p>
      </div>
    </div>
  );
}
