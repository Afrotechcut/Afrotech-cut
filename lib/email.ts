import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@afrotechcuts.co.uk';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  barberEmail?: string;
  shopName: string;
  shopAddress: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  totalPrice: number;
  bookingId: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Booking confirmed at ${data.shopName}`,
    html: bookingConfirmationHtml(data),
  });
}

export async function sendBarberNotification(data: BookingEmailData & { barberEmail: string }) {
  await resend.emails.send({
    from: FROM,
    to: data.barberEmail,
    subject: `New booking: ${data.customerName} — ${data.appointmentDate} at ${data.appointmentTime}`,
    html: barberNotificationHtml(data),
  });
}

function bookingConfirmationHtml(d: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Confirmed</title></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f9fafb;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;padding:32px 40px;">
      <p style="color:#c98518;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">AFROTECHCUTS</p>
      <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0;">Booking Confirmed</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi ${d.customerName}, your appointment is locked in.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Barber</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.shopName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Service</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.serviceName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Date</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.appointmentDate}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Time</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.appointmentTime}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Address</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.shopAddress}</td></tr>
          <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 0 6px;color:#111827;font-size:15px;font-weight:600;">Total</td><td style="padding:12px 0 6px;color:#c98518;font-size:15px;font-weight:700;text-align:right;">£${d.totalPrice.toFixed(2)}</td></tr>
        </table>
      </div>
      <p style="color:#6b7280;font-size:14px;margin:0;">Need to cancel? Contact the barber directly or visit <a href="${APP_URL}" style="color:#c98518;">afrotechcuts.co.uk</a>.</p>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #e5e7eb;background:#f9fafb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">AFROTECHCUTS — Find your barber, book in seconds.</p>
    </div>
  </div>
</body>
</html>`;
}

function barberNotificationHtml(d: BookingEmailData & { barberEmail: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Booking</title></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f9fafb;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;padding:32px 40px;">
      <p style="color:#c98518;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">AFROTECHCUTS</p>
      <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0;">New Booking</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">You have a new appointment.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Customer</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.customerName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.customerEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Service</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.serviceName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Date</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.appointmentDate}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Time</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${d.appointmentTime}</td></tr>
          <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 0 6px;color:#111827;font-size:15px;font-weight:600;">Revenue</td><td style="padding:12px 0 6px;color:#c98518;font-size:15px;font-weight:700;text-align:right;">£${d.totalPrice.toFixed(2)}</td></tr>
        </table>
      </div>
      <a href="${APP_URL}/dashboard/bookings" style="display:inline-block;background:#111827;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">View in Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}
