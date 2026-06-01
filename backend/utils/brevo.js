// Brevo Transactional Email Integration for Backend Node.js
import dotenv from 'dotenv';
dotenv.config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send a secure transaction OTP email via Brevo
 * @param {string} toEmail - Recipient email
 * @param {string} toName  - Recipient name
 * @param {string} otp     - 6-digit OTP code
 * @param {object} orderDetails - { productName, shopName, price }
 * @param {object} customConfig - { apiKey, senderEmail, senderName } (optional overrides)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, htmlContent: string }>}
 */
export const sendOTPEmail = async (toEmail, toName, otp, orderDetails, customConfig = {}) => {
  const { productName, shopName, price } = orderDetails;
  const formattedOTP = `${otp.slice(0, 3)}-${otp.slice(3)}`;

  // Securely retrieve keys from server environment, with optional runtime user overrides
  const apiKey = customConfig?.apiKey || process.env.BREVO_API_KEY || '';
  const senderEmail = customConfig?.senderEmail || process.env.BREVO_SENDER_EMAIL || 'aakashsai951@gmail.com';
  const senderName = customConfig?.senderName || process.env.BREVO_SENDER_NAME || 'Stikbook';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stikbook OTP</title>
</head>
<body style="margin:0;padding:0;background:#08080A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" style="max-width:520px;background:#121217;border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F1A12,#1A2E1E);padding:32px 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:8px;">
                      <div style="width:36px;height:36px;background:#F59E0B;border-radius:50%;display:inline-block;text-align:center;line-height:36px;font-size:18px;font-weight:bold;color:#fff;font-family:sans-serif;">S</div>
                      <span style="color:#FFFFFF;font-size:20px;font-weight:800;margin-left:10px;font-family:sans-serif;vertical-align:middle;">Stikbook</span>
                      <span style="background:rgba(74,222,128,0.15);color:#4ADE80;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:6px;margin-left:8px;font-family:sans-serif;vertical-align:middle;">WALLET</span>
                    </div>
                    <p style="color:#94A3B8;margin:8px 0 0 0;font-size:13px;font-family:sans-serif;">Secure Redemption Code</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;font-family:sans-serif;">
              <p style="color:#FFFFFF;font-size:16px;margin:0 0 8px 0;">Hello, <strong style="color:#4ADE80;">${toName}</strong> 👋</p>
              <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0 0 28px 0;">
                You requested to redeem <strong style="color:#FFF;">${productName}</strong> at <strong style="color:#FFF;">${shopName}</strong>.
                Use the secure OTP below at the merchant counter.
              </p>

              <!-- OTP Display Box -->
              <div style="background:#0F0F13;border:2px solid #4ADE80;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;">Your One-Time Passcode</p>
                <div style="font-size:38px;font-weight:900;letter-spacing:8px;color:#4ADE80;font-family:'Courier New',monospace;">${formattedOTP}</div>
                <p style="color:#94A3B8;font-size:11px;margin:12px 0 0 0;">⏳ Expires in <strong style="color:#F59E0B;">5 minutes</strong></p>
              </div>

              <!-- Order Summary -->
              <table width="100%" style="background:#1B1B22;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;text-transform:uppercase;">Product</span><br>
                    <span style="color:#FFF;font-size:14px;font-weight:600;">${productName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;text-transform:uppercase;">Merchant</span><br>
                    <span style="color:#FFF;font-size:14px;font-weight:600;">${shopName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;text-transform:uppercase;">Cost</span><br>
                    <span style="color:#4ADE80;font-size:18px;font-weight:800;">${price} SC</span>
                  </td>
                </tr>
              </table>

              <p style="color:#94A3B8;font-size:12px;line-height:1.5;margin:0;">
                ⚠️ <strong style="color:#FFF;">Never share this OTP</strong> with anyone other than the Stikbook merchant at the counter. This code is single-use and expires in 5 minutes.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F0F13;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);font-family:sans-serif;">
              <p style="color:#475569;font-size:11px;margin:0;text-align:center;">
                🔒 Protected by Stik-Block · Stikbook Rewards Platform · Do not reply to this email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `
Stikbook OTP - Secure Redemption Code

Hello ${toName},

You requested to redeem: ${productName}
Merchant: ${shopName}
Cost: ${price} SC

Your OTP: ${formattedOTP}

This code expires in 5 minutes. Never share it with anyone.
`;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: toEmail, name: toName }],
        subject: `🎫 Your Stikbook OTP: ${formattedOTP} (${productName})`,
        htmlContent,
        textContent,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, messageId: data.messageId, htmlContent };
    } else {
      const err = await response.json();
      console.error('Brevo Live API failed in Backend:', response.status, err);
      return { success: false, error: err.message || `HTTP ${response.status}`, htmlContent };
    }
  } catch (err) {
    console.error('Brevo network exception in Backend:', err);
    return { success: false, error: err.message, htmlContent };
  }
};

/**
 * Send a transaction success confirmation email receipt
 * @param {string} toEmail - Recipient email
 * @param {string} toName  - Recipient name
 * @param {object} orderDetails - { productName, shopName, price, orderRef, newBalance }
 * @param {object} customConfig - { apiKey, senderEmail, senderName } (optional overrides)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, htmlContent: string }>}
 */
export const sendConfirmationEmail = async (toEmail, toName, orderDetails, customConfig = {}) => {
  const { productName, shopName, price, orderRef, newBalance } = orderDetails;

  const apiKey = customConfig?.apiKey || process.env.BREVO_API_KEY || '';
  const senderEmail = customConfig?.senderEmail || process.env.BREVO_SENDER_EMAIL || 'aakashsai951@gmail.com';
  const senderName = customConfig?.senderName || process.env.BREVO_SENDER_NAME || 'Stikbook';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#08080A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080A;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" style="max-width:520px;background:#121217;border-radius:24px;border:1px solid rgba(74,222,128,0.2);overflow:hidden;">
          <tr>
            <td style="padding:36px;text-align:center;font-family:sans-serif;">
              <div style="width:72px;height:72px;background:rgba(74,222,128,0.12);border:3px solid #4ADE80;border-radius:50%;margin:0 auto 20px;display:inline-block;text-align:center;line-height:72px;font-size:36px;color:#4ADE80;">✓</div>
              <h1 style="color:#FFF;font-size:22px;margin:0 0 8px 0;">Redemption Successful!</h1>
              <p style="color:#94A3B8;font-size:13px;margin:0 0 28px 0;">Your Stikcoins have been spent and order confirmed at ${shopName}.</p>

              <table width="100%" style="background:#1B1B22;border-radius:12px;text-align:left;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;">ORDER REF</span><br>
                    <span style="color:#4ADE80;font-size:13px;font-weight:600;font-family:monospace;">${orderRef}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;">PRODUCT</span><br>
                    <span style="color:#FFF;font-size:14px;font-weight:600;">${productName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;">DEDUCTED</span><br>
                    <span style="color:#EF4444;font-size:18px;font-weight:800;">-${price} SC</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-family:sans-serif;">
                    <span style="color:#94A3B8;font-size:11px;">NEW BALANCE</span><br>
                    <span style="color:#4ADE80;font-size:18px;font-weight:800;">${newBalance} SC</span>
                  </td>
                </tr>
              </table>

              <p style="color:#475569;font-size:11px;margin:0;">
                🔒 Stikbook Rewards · Transaction verified by merchant terminal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail, name: toName }],
        subject: `✅ Order Confirmed: ${productName} redeemed successfully!`,
        htmlContent,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, messageId: data.messageId, htmlContent };
    } else {
      const err = await response.json();
      console.error('Brevo live confirmation failed in Backend:', response.status, err);
      return { success: false, error: err.message || 'Email send failed', htmlContent };
    }
  } catch (err) {
    console.error('Brevo Live confirmation receipt exception in Backend:', err);
    return { success: false, error: err.message, htmlContent };
  }
};
