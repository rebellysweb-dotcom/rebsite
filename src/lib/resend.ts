import { Resend } from 'resend';
import type { Order } from '@/types';
import { formatUsd, formatDate } from './utils';

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'orders@rebellys.com';
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "Rebelly's Flower Shop";

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  if (!order.customer_email) return false;

  const resend = getResend();
  if (!resend) return false;

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3e8f0;">${esc(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3e8f0;text-align:right;">${item.price_usd ? formatUsd(item.price_usd * item.quantity) : 'TBC'}</td>
        </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmed – Rebelly's</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(233,30,140,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e91e8c,#c2185b);padding:40px 40px 32px;text-align:center;">
              ${process.env.LOGO_EMAIL_URL
                ? `<img src="${process.env.LOGO_EMAIL_URL}" alt="Rebelly's Flower Shop" width="140" height="auto" style="display:block;margin:0 auto 16px;max-height:60px;object-fit:contain;" />`
                : `<div style="font-size:2rem;margin-bottom:8px;">✿</div>`
              }
              <h1 style="margin:0;color:#fff;font-size:1.6rem;font-weight:600;letter-spacing:0.5px;">Order Confirmed</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:0.95rem;">Thank you for choosing Rebelly's Flower Shop</p>
            </td>
          </tr>
          <!-- Order Number Banner -->
          <tr>
            <td style="background:#fdf0f7;padding:20px 40px;border-bottom:1px solid #f3e8f0;text-align:center;">
              <p style="margin:0;font-size:0.85rem;color:#9e6b8a;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
              <p style="margin:4px 0 0;font-size:1.5rem;font-weight:700;color:#c2185b;letter-spacing:2px;">${order.order_number}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;color:#4a2c3d;font-size:1rem;">Hi <strong>${esc(order.customer_name)}</strong>,</p>
              <p style="margin:0 0 24px;color:#6b4a5a;line-height:1.6;">
                We've received your order and our team will be in touch shortly to confirm the final price, delivery details, and payment.
              </p>

              <!-- Items Table -->
              <h3 style="margin:0 0 12px;color:#c2185b;font-size:1rem;">Your Order</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:8px 0;border-bottom:2px solid #e91e8c;color:#9e6b8a;font-size:0.8rem;text-transform:uppercase;">Item</th>
                    <th style="text-align:center;padding:8px 0;border-bottom:2px solid #e91e8c;color:#9e6b8a;font-size:0.8rem;text-transform:uppercase;">Qty</th>
                    <th style="text-align:right;padding:8px 0;border-bottom:2px solid #e91e8c;color:#9e6b8a;font-size:0.8rem;text-transform:uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>

              ${order.total_usd ? `<p style="text-align:right;margin:12px 0 0;font-weight:600;color:#c2185b;">Estimated Total: ${formatUsd(order.total_usd)}</p>` : ''}

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#fdf6f9;border-radius:10px;padding:0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 14px;color:#c2185b;font-size:1rem;">Order Details</h3>
                    <p style="margin:0 0 6px;color:#6b4a5a;font-size:0.9rem;"><strong>Fulfillment:</strong> ${order.fulfillment === 'delivery' ? '🚚 Delivery' : '🏪 In-store Pickup'}</p>
                    ${order.delivery_area ? `<p style="margin:0 0 6px;color:#6b4a5a;font-size:0.9rem;"><strong>Area:</strong> ${esc(order.delivery_area)}</p>` : ''}
                    ${order.delivery_date ? `<p style="margin:0 0 6px;color:#6b4a5a;font-size:0.9rem;"><strong>Preferred Date:</strong> ${formatDate(order.delivery_date)}</p>` : ''}
                    ${order.delivery_time ? `<p style="margin:0 0 6px;color:#6b4a5a;font-size:0.9rem;"><strong>Preferred Time:</strong> ${esc(order.delivery_time)}</p>` : ''}
                    ${order.occasion ? `<p style="margin:0 0 6px;color:#6b4a5a;font-size:0.9rem;"><strong>Occasion:</strong> ${esc(order.occasion)}</p>` : ''}
                    <p style="margin:0;color:#6b4a5a;font-size:0.9rem;"><strong>Payment:</strong> ${order.payment_method === 'whish' ? '📱 Whish Lebanon' : order.payment_method === 'cash' ? '💵 Cash' : 'To be confirmed'}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#6b4a5a;line-height:1.6;font-size:0.9rem;">
                Questions? WhatsApp us at <a href="https://wa.me/96176585028" style="color:#e91e8c;text-decoration:none;">+961 76 585 028</a> or call us at the same number.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fdf0f7;padding:24px 40px;text-align:center;border-top:1px solid #f3e8f0;">
              <p style="margin:0;color:#9e6b8a;font-size:0.8rem;">✿ Rebelly's Flower Shop · Saydeh Street, Zalka, Lebanon</p>
              <p style="margin:6px 0 0;color:#9e6b8a;font-size:0.8rem;">Mon–Sat · 9:30 AM – 7:30 PM</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: [order.customer_email],
      subject: `Your Order #${order.order_number} is Confirmed 🌸 — Rebelly's`,
      html,
    });
    if (error) {
      console.error('[Resend] Failed to send confirmation email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Resend] Exception sending email:', err);
    return false;
  }
}

export async function sendAdminNewOrderEmail(order: Order, adminEmail: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const adminItemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8f0;color:#4a2c3d;">${esc(item.name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8f0;text-align:center;color:#4a2c3d;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8f0;text-align:right;color:#4a2c3d;">${item.price_usd ? formatUsd(item.price_usd * item.quantity) : 'TBC'}</td>
        </tr>`
    )
    .join('');

  const detailRows = [
    { label: 'Fulfillment', value: order.fulfillment === 'delivery' ? 'Delivery' : 'In-store Pickup' },
    order.delivery_area ? { label: 'Area', value: esc(order.delivery_area) } : null,
    order.delivery_address ? { label: 'Address', value: esc(order.delivery_address) } : null,
    order.delivery_date ? { label: 'Preferred Date', value: formatDate(order.delivery_date) } : null,
    order.delivery_time ? { label: 'Preferred Time', value: esc(order.delivery_time) } : null,
    order.occasion ? { label: 'Occasion', value: esc(order.occasion) } : null,
    order.card_message ? { label: 'Card Message', value: esc(order.card_message) } : null,
    order.notes ? { label: 'Notes', value: esc(order.notes) } : null,
    { label: 'Payment Method', value: order.payment_method === 'whish' ? 'Whish Lebanon' : order.payment_method === 'cash' ? 'Cash' : 'Other' },
  ]
    .filter(Boolean)
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3e8f0;font-weight:600;color:#9e6b8a;font-size:0.85rem;white-space:nowrap;width:160px;">${(row as { label: string; value: string }).label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3e8f0;color:#4a2c3d;font-size:0.9rem;">${(row as { label: string; value: string }).value}</td>
        </tr>`
    )
    .join('');

  const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>New Order — Rebelly's Admin</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(233,30,140,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e91e8c,#c2185b);padding:36px 40px 28px;text-align:center;">
              ${process.env.LOGO_EMAIL_URL
                ? `<img src="${process.env.LOGO_EMAIL_URL}" alt="Rebelly's Flower Shop" width="120" height="auto" style="display:block;margin:0 auto 14px;max-height:50px;object-fit:contain;" />`
                : `<div style="font-size:1.8rem;margin-bottom:8px;">✿</div>`
              }
              <h1 style="margin:0;color:#fff;font-size:1.4rem;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">New Order</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:1.1rem;font-weight:600;letter-spacing:2px;">Invoice #${esc(order.order_number)}</p>
            </td>
          </tr>
          <!-- Customer Section -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h2 style="margin:0 0 14px;color:#c2185b;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Customer</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f9;border-radius:10px;">
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3e8f0;font-weight:600;color:#9e6b8a;font-size:0.85rem;white-space:nowrap;width:80px;">Name</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3e8f0;color:#4a2c3d;font-size:0.9rem;">${esc(order.customer_name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3e8f0;font-weight:600;color:#9e6b8a;font-size:0.85rem;">Phone</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #f3e8f0;color:#4a2c3d;font-size:0.9rem;">${esc(order.customer_phone)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;font-weight:600;color:#9e6b8a;font-size:0.85rem;">Email</td>
                  <td style="padding:8px 12px;color:#4a2c3d;font-size:0.9rem;">${esc(order.customer_email)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Items Table -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h2 style="margin:0 0 14px;color:#c2185b;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#fdf0f7;">
                    <th style="text-align:left;padding:10px 12px;color:#9e6b8a;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Item</th>
                    <th style="text-align:center;padding:10px 12px;color:#9e6b8a;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Qty</th>
                    <th style="text-align:right;padding:10px 12px;color:#9e6b8a;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Price</th>
                  </tr>
                </thead>
                <tbody>${adminItemsHtml}</tbody>
              </table>
              ${order.total_usd ? `<p style="text-align:right;margin:10px 0 0;font-weight:700;color:#c2185b;font-size:1rem;">Total: ${formatUsd(order.total_usd)}</p>` : ''}
            </td>
          </tr>
          <!-- Order Details -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h2 style="margin:0 0 14px;color:#c2185b;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f9;border-radius:10px;">
                ${detailRows}
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rebellys.com'}/admin"
                 style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:0.95rem;letter-spacing:0.5px;">
                Login to Admin Panel
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:linear-gradient(135deg,#e91e8c,#c2185b);padding:20px 40px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:0.8rem;">✿ Rebelly's Flower Shop · Internal Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: [adminEmail],
      subject: `New Order #${order.order_number} — ${esc(order.customer_name)}`,
      html: adminHtml,
    });
  } catch (err) {
    console.error('[Resend] Admin notification failed:', err);
  }
}
