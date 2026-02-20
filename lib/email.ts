import nodemailer from "nodemailer";

/* -------------------------------------------------------------------------- */
/*                                CONFIG                                      */
/* -------------------------------------------------------------------------- */

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  NEXT_PUBLIC_APP_URL,
  NODE_ENV,
} = process.env;

const IS_MOCK = !SMTP_HOST;

const transporter = !IS_MOCK
  ? nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465, // true only for 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
  : null;

const APP_URL = NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const STORE_NAME = "11 Code Store";

/* -------------------------------------------------------------------------- */
/*                               UTIL                                          */
/* -------------------------------------------------------------------------- */

async function sendMailSafe(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<boolean> {
  if (IS_MOCK) {
    console.log("📨 [MOCK EMAIL]");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    if (options.replyTo) console.log("Reply-To:", options.replyTo);
    return true;
  }

  try {
    await transporter!.sendMail({
      from: options.from || `"${STORE_NAME}" <no-reply@11code.com>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (NODE_ENV !== "production") {
      console.log("✅ Email sent to", options.to);
    }
    return true;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*                           CONTACT FORM EMAIL                               */
/* -------------------------------------------------------------------------- */

export async function sendContactFormEmail(name: string, email: string, message: string): Promise<boolean> {
  const adminEmail = process.env.SMTP_USER || "11codestore@gmail.com";

  return await sendMailSafe({
    to: adminEmail,
    replyTo: email,
    subject: `New Message from ${name} - 11 Code Contact`,
    html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #050A30;">
                <h1 style="text-transform: uppercase;">New Contact Message</h1>
                
                <p><strong>From:</strong> ${name} (${email})</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #050A30; margin: 20px 0;">
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                    You can reply directly to this email to contact the user.
                </p>
            </div>
        `
  });
}

/* -------------------------------------------------------------------------- */
/*                           PASSWORD RESET EMAIL                             */
/* -------------------------------------------------------------------------- */

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  return await sendMailSafe({
    to,
    subject: "Reset Your Password - 11 Code",
    html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #050A30;">
                <h1 style="text-transform: uppercase;">Password Reset Request</h1>
                
                <p>We received a request to reset your password for your <strong>11 Code</strong> account.</p>
                
                <p>Click the button below to set a new password:</p>
                
                <a 
                    href="${resetLink}" 
                    style="
                        display: inline-block; 
                        margin-top: 20px; 
                        background-color: #050A30; 
                        color: #ffffff; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        font-weight: bold;
                    "
                >
                    RESET PASSWORD
                </a>
                
                <p style="margin-top: 32px; font-size: 14px; color: #666;">
                    If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
                </p>
                
                <p style="margin-top: 32px;">
                    — Team 11 Code
                </p>
            </div>
        `
  });
}

/* -------------------------------------------------------------------------- */
/*                           WELCOME EMAIL                                    */
/* -------------------------------------------------------------------------- */

export async function sendWelcomeEmail(
  to: string,
  name: string = "there"
) {
  await sendMailSafe({
    to,
    subject: "Welcome to the 11 Code Club 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #050A30;">
        <h1 style="text-transform: uppercase;">Welcome to the Squad, ${name}!</h1>

        <p>You’ve successfully joined <strong>11 Code</strong> — home of premium football culture.</p>

        <p>As a member, you’ll get:</p>
        <ul>
          <li>Early access to drops</li>
          <li>Member-only collections</li>
          <li>Exclusive offers</li>
        </ul>

        <a
          href="${APP_URL}/shop"
          style="
            display: inline-block;
            margin-top: 20px;
            background-color: #050A30;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            font-weight: bold;
          "
        >
          SHOP NOW
        </a>

        <p style="margin-top: 32px;">
          — Team 11 Code
        </p>
      </div>
    `,
  });
}

/* -------------------------------------------------------------------------- */
/*                         NEWSLETTER SUBSCRIPTION                             */
/* -------------------------------------------------------------------------- */

export async function sendSubscriptionEmail(to: string) {
  await sendMailSafe({
    to,
    subject: "Welcome to the 11 Code Newsletter 🖤",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #050A30;">
        <h1 style="text-transform: uppercase;">You're on the list!</h1>

        <p>Thanks for subscribing to the <strong>11 Code</strong> newsletter.</p>

        <p>You’ll be the first to know about:</p>
        <ul>
          <li>New kit drops</li>
          <li>Restocks</li>
          <li>Exclusive offers</li>
        </ul>

        <p style="margin-top: 32px;">
          — Team 11 Code
        </p>
      </div>
    `,
    from: `"11 Code Newsletter" <newsletter@11code.com>`,
  });
}

/* -------------------------------------------------------------------------- */
/*                         ORDER CONFIRMATION                                  */
/* -------------------------------------------------------------------------- */

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderEmailData {
  id: string;
  total: number;
  customerName: string;
  items: OrderItem[];
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: OrderEmailData
) {
  const subject = `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`;

  const itemsHtml = order.items
    .map(
      (item) => `
        <div style="border-bottom: 1px solid #e5e5e5; padding: 10px 0;">
          <strong>${item.name}</strong><br/>
          Qty: ${item.quantity} · ₹${item.price.toFixed(2)}
        </div>
      `
    )
    .join("");

  await sendMailSafe({
    to,
    subject,
    from: `"11 Code Orders" <orders@11code.com>`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #050A30;">
        <h1 style="text-transform: uppercase;">Order Confirmed ✅</h1>

        <p>Hi ${order.customerName},</p>
        <p>Thank you for your purchase! We’re preparing your kit for dispatch.</p>

        <h3 style="margin-top: 32px; border-bottom: 2px solid #050A30;">
          Order Summary
        </h3>

        ${itemsHtml}

        <div style="margin-top: 20px; text-align: right;">
          <h3>Total: ₹${order.total.toFixed(2)}</h3>
        </div>

        <a
          href="${APP_URL}/profile"
          style="
            display: inline-block;
            margin-top: 20px;
            background-color: #050A30;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            font-weight: bold;
          "
        >
          VIEW ORDER
        </a>

        <p style="margin-top: 32px;">
          — Team 11 Code
        </p>
      </div>
    `,
  });
}
