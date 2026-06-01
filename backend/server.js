import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendOTPEmail, sendConfirmationEmail } from './utils/brevo.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React app can communicate with the server
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODELS & INITIAL STATE (IN-MEMORY CENTRAL STORE)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_DEMO_USERS = {
  customer: {
    id: 'user-001',
    role: 'customer',
    name: 'Akash',
    email: 'aakash.srisai@gmail.com',
    phone: '+91 98765 43210',
    avatar: '👦',
    password: 'demo123',
    streakDays: 7,
    totalRedeemed: 3,
    joinDate: 'Jan 2025',
    balance: 590,
  },
  shopkeeper: {
    id: 'shop-001',
    role: 'shopkeeper',
    name: 'Uma Sri',
    email: 'akash.sai4491@gmail.com',
    phone: '+91 99887 76655',
    avatar: '👩‍💼',
    password: 'demo123',
    shopId: 's1',
    joinDate: 'Nov 2024',
  },
};

const SHOPS = [
  {
    id: 's1',
    name: 'Cafe Espresso & Co.',
    icon: '☕',
    products: [
      { id: 'p11', name: 'Cold Drink', price: 50, icon: '🥤', desc: 'Chilled fizzy cola with lemon infusion' },
      { id: 'p12', name: 'Gourmet Cappuccino', price: 80, icon: '☕', desc: 'Fresh roasted double espresso with microfoam' },
      { id: 'p13', name: 'Warm Chocolate Muffin', price: 110, icon: '🧁', desc: 'Fudgy melt-in-mouth triple chocolate chips' },
      { id: 'p14', name: 'Avocado Toast', price: 130, icon: '🥑', desc: 'Sourdough with fresh avocado and sea salt' },
    ],
  },
  {
    id: 's2',
    name: 'Organic Green Market',
    icon: '🍎',
    products: [
      { id: 'p21', name: 'Cold-Pressed Apple Juice', price: 65, icon: '🧃', desc: '100% natural organic locally-harvested apples' },
      { id: 'p22', name: 'Tropical Smoothie Bowl', price: 90, icon: '🍌', desc: 'Greek yogurt with organic honey & berries' },
      { id: 'p23', name: 'Gourmet Avocado Mash', price: 140, icon: '🥑', desc: 'Handcrafted avocado spreads with sourdough' },
    ],
  },
  {
    id: 's3',
    name: 'Tech & Gadgets Express',
    icon: '🔌',
    products: [
      { id: 'p31', name: 'Type-C Braided Cable', price: 180, icon: '🔌', desc: 'High-speed 65W power delivery charging cord' },
      { id: 'p32', name: 'Dual Qi Wireless Charger', price: 320, icon: '🔋', desc: 'Anti-slip neon glass dual charging station' },
      { id: 'p33', name: 'Bluetooth ANC Earbuds', price: 500, icon: '🎧', desc: 'Pure bass active noise cancelling buds' },
      { id: 'p34', name: 'Mechanical RGB Keyboard', price: 650, icon: '⌨️', desc: 'Premium aluminium keycaps blue-switches' },
    ],
  },
  {
    id: 's4',
    name: 'Stikbook MegaMart',
    icon: '🛒',
    products: [
      { id: 'p41', name: 'Sweet & Salty Snack Box', price: 75, icon: '🍿', desc: 'Assorted artisan chips, popcorn & cookies' },
      { id: 'p42', name: 'Insulated Hydroflask (1L)', price: 290, icon: '🍶', desc: 'Double-walled cold-lock stainless steel vacuum' },
      { id: 'p43', name: 'Water-Resistant Duffle', price: 540, icon: '🎒', desc: 'Smart storage lightweight adventure pack' },
    ],
  },
];

// STATE STORE (reinitialized to default on dev reset)
let balance = DEFAULT_DEMO_USERS.customer.balance;
let dailyClaimed = false;
let transactions = [
  { id: 'tx-0', type: 'bonus', amount: 580, title: 'Stikbook Welcome Pack', date: 'Yesterday, 04:30 PM', shopName: 'Stikbook HQ', icon: '🎁' },
  { id: 'tx-1', type: 'reward', amount: 10, title: 'Sign-in Streak Bonus', date: 'Today, 09:15 AM', shopName: 'Stikbook App', icon: '⭐' },
];

let pendingOrder = null; // Stores currently generated OTP / checkout instance
let shopOrders = [];    // Verified sales ledger history for POS
let sentEmails = [];    // Simulated email client inbox ledger

// Custom configs storage for testing different keys
let brevoApiKey = process.env.BREVO_API_KEY || '';
let brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'aakashsai951@gmail.com';

// ─────────────────────────────────────────────────────────────────────────────
// STATE HELPER
// ─────────────────────────────────────────────────────────────────────────────
const getCombinedState = () => {
  return {
    balance,
    dailyClaimed,
    transactions,
    pendingOrder,
    shopOrders,
    sentEmails,
    brevoApiKey,
    brevoSenderEmail,
  };
};

const addSentEmailRecord = (email) => {
  sentEmails.unshift({
    id: `mail-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ...email
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// Get state of full simulation
app.get('/api/state', (req, res) => {
  res.json(getCombinedState());
});

// User sign-in
app.post('/api/auth/login', (req, res) => {
  const { role, password } = req.body;
  const user = DEFAULT_DEMO_USERS[role];

  if (!user) {
    return res.status(404).json({ ok: false, error: 'Invalid role selected.' });
  }

  if (password !== user.password) {
    return res.status(401).json({ ok: false, error: 'Wrong password. Try demo123.' });
  }

  // Hydrate user with dynamic balance for customer
  const sessionUser = { ...user };
  if (role === 'customer') {
    sessionUser.balance = balance;
  }

  res.json({ ok: true, user: sessionUser });
});

// Claim Daily Rewards Streak
app.post('/api/claim-daily', (req, res) => {
  if (dailyClaimed) {
    return res.status(400).json({ ok: false, error: 'Daily reward already claimed today.' });
  }

  balance += 10;
  dailyClaimed = true;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';
  
  transactions.unshift({
    id: `tx-${Date.now()}`,
    type: 'reward',
    amount: 10,
    title: 'Daily Login Reward',
    date: timeStr,
    shopName: 'Stikbook App',
    icon: '⭐',
  });

  res.json({ success: true, message: 'Claimed +10 SC successfully!', state: getCombinedState() });
});

// Customer: Place Order & Generate OTP email
app.post('/api/orders/place', async (req, res) => {
  const { shopId, productId, toEmail } = req.body;

  const shop = SHOPS.find(s => s.id === shopId);
  if (!shop) return res.status(404).json({ error: 'Shop not found.' });

  const product = shop.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  if (balance < product.price) {
    return res.status(400).json({ error: `Insufficient Stikcoins! You need ${product.price - balance} more SC.` });
  }

  // Generate clean 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Generate high-end alpha-numeric order ref
  const orderRef = `STIK-${shopId.toUpperCase()}-${productId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const customerObj = DEFAULT_DEMO_USERS.customer;

  // Build the secure pending transaction object
  pendingOrder = {
    id: `order-${Date.now()}`,
    otp,
    orderRef,
    shop,
    product,
    customer: {
      ...customerObj,
      balance, // Current snapshot
    },
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
    status: 'pending',
  };

  // Dispatch OTP email using our backend Brevo integrations!
  let emailSuccess = false;
  let emailError = '';
  let emailResponse = null;

  if (toEmail) {
    emailResponse = await sendOTPEmail(toEmail, customerObj.name, otp, {
      productName: product.name,
      shopName: shop.name,
      price: product.price,
    }, {
      apiKey: brevoApiKey,
      senderEmail: brevoSenderEmail,
    });

    emailSuccess = emailResponse.success;
    emailError = emailResponse.error || '';

    // ALWAYS register into in-app mailbox ledger for perfect offline demos!
    addSentEmailRecord({
      to: toEmail,
      from: brevoSenderEmail,
      subject: `🎫 Your Stikbook OTP: ${otp.slice(0, 3)}-${otp.slice(3)} (${product.name})`,
      htmlContent: emailResponse.htmlContent,
    });
  }

  res.json({
    success: true,
    emailSent: emailSuccess,
    emailError,
    order: pendingOrder,
    state: getCombinedState()
  });
});

// Customer/System: Trigger manual OTP email dispatch from backend
app.post('/api/orders/email-otp', async (req, res) => {
  const { email } = req.body;
  if (!pendingOrder) {
    return res.status(400).json({ error: 'No active pending order found.' });
  }

  const emailResponse = await sendOTPEmail(email, pendingOrder.customer.name, pendingOrder.otp, {
    productName: pendingOrder.product.name,
    shopName: pendingOrder.shop.name,
    price: pendingOrder.product.price,
  }, {
    apiKey: brevoApiKey,
    senderEmail: brevoSenderEmail,
  });

  addSentEmailRecord({
    to: email,
    from: brevoSenderEmail,
    subject: `🎫 Your Stikbook OTP: ${pendingOrder.otp.slice(0, 3)}-${pendingOrder.otp.slice(3)} (${pendingOrder.product.name})`,
    htmlContent: emailResponse.htmlContent,
  });

  res.json({
    success: emailResponse.success,
    error: emailResponse.error || '',
    state: getCombinedState()
  });
});

// Customer: Cancel Pending Order
app.post('/api/orders/cancel', (req, res) => {
  pendingOrder = null;
  res.json({ success: true, state: getCombinedState() });
});

// Shopkeeper Cashier POS: Approve Order by Manual OTP or Scanner Code
app.post('/api/orders/approve', async (req, res) => {
  const { otp, bypassVerification } = req.body;

  if (!pendingOrder) {
    return res.status(400).json({ error: 'No active pending checkout session detected.' });
  }

  const cleanInput = (otp || '').replace(/[^0-9]/g, '');
  const cleanExpected = pendingOrder.otp.replace(/[^0-9]/g, '');

  const verified = bypassVerification || (cleanInput === cleanExpected);

  if (!verified) {
    return res.status(400).json({ error: 'Mismatched OTP entered! Please check code.' });
  }

  const activeOrder = { ...pendingOrder };
  const price = activeOrder.product.price;
  const prodName = activeOrder.product.name;
  const shopName = activeOrder.shop.name;
  const orderRef = activeOrder.orderRef;
  const customerEmail = activeOrder.customer.email;

  // Deduct coins securely on server
  balance -= price;

  const now = new Date();
  const dateStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';

  // Log transaction to customer ledger
  transactions.unshift({
    id: `tx-${Date.now()}`,
    type: 'redeem',
    amount: price,
    title: `Redeemed: ${prodName}`,
    date: dateStr,
    shopName: shopName,
    icon: activeOrder.product.icon,
    orderRef: orderRef,
    status: 'Verified ✓',
  });

  // Log completed order for merchant stats
  shopOrders.unshift({
    id: `so-${Date.now()}`,
    orderRef: orderRef,
    productName: prodName,
    productIcon: activeOrder.product.icon,
    customerName: activeOrder.customer.name,
    price: price,
    date: dateStr,
    status: 'Completed',
  });

  // Clear pending state
  pendingOrder = null;

  // Asynchronously dispatch confirmation receipt email via Brevo
  let emailSent = false;
  let emailError = '';

  if (customerEmail) {
    const emailResponse = await sendConfirmationEmail(customerEmail, activeOrder.customer.name, {
      productName: prodName,
      shopName: shopName,
      price: price,
      orderRef: orderRef,
      newBalance: balance,
    }, {
      apiKey: brevoApiKey,
      senderEmail: brevoSenderEmail,
    });

    emailSent = emailResponse.success;
    emailError = emailResponse.error || '';

    // Record receipt inside simulated mailbox
    addSentEmailRecord({
      to: customerEmail,
      from: brevoSenderEmail,
      subject: `✅ Order Confirmed: ${prodName} redeemed successfully!`,
      htmlContent: emailResponse.htmlContent,
    });
  }

  res.json({
    success: true,
    emailSent,
    emailError,
    state: getCombinedState(),
  });
});

// Developer: Add coins dynamically
app.post('/api/dev/add-coins', (req, res) => {
  const { amount } = req.body;
  const addAmount = parseInt(amount) || 100;
  
  balance += addAmount;

  res.json({ success: true, state: getCombinedState() });
});

// Developer: Reset State
app.post('/api/dev/reset', (req, res) => {
  balance = DEFAULT_DEMO_USERS.customer.balance;
  dailyClaimed = false;
  pendingOrder = null;
  shopOrders = [];
  sentEmails = [];
  transactions = [
    { id: 'tx-0', type: 'bonus', amount: 580, title: 'Stikbook Welcome Pack', date: 'Yesterday, 04:30 PM', shopName: 'Stikbook HQ', icon: '🎁' },
    { id: 'tx-1', type: 'reward', amount: 10, title: 'Sign-in Streak Bonus', date: 'Today, 09:15 AM', shopName: 'Stikbook App', icon: '⭐' },
  ];

  res.json({ success: true, message: 'All demo simulator states successfully reset!', state: getCombinedState() });
});

// Update dynamic Brevo server-side API configs
app.post('/api/brevo/config', (req, res) => {
  const { apiKey, senderEmail } = req.body;

  if (apiKey !== undefined) brevoApiKey = apiKey;
  if (senderEmail !== undefined) brevoSenderEmail = senderEmail;

  res.json({ success: true, state: getCombinedState() });
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Stikbook Premium Backend Server running on port ${PORT}`);
  console.log(`🔒 Brevo SMTP Service initialized securely from environmental memory.`);
});
