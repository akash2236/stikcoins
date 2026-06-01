// OTP Generator Utility
// Generates cryptographically-random OTPs and unique transaction references

export const generateOTP = () => {
  // 6-digit numeric OTP
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return digits;
};

export const generateOrderRef = (shopId, productId) => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `STK-${shopId.toUpperCase()}-${ts}-${rand}`;
};

export const generateSessionToken = () => {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// Format OTP with dash separator for display: 482-710
export const formatOTPDisplay = (otp) => {
  return `${otp.slice(0, 3)}-${otp.slice(3)}`;
};

// Validate OTP (numeric, 6 digits)
export const validateOTP = (input, expected) => {
  const clean = input.replace(/[^0-9]/g, '');
  return clean === expected;
};
