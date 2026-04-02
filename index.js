"use strict";

const express = require("express");
const crypto = require("crypto");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

// ─────────────────────────────────────────────
// ENV VALIDATION
// ─────────────────────────────────────────────
const REQUIRED_ENV = [
  "PAYSTACK_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  // Optional but recommended: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
}

const {
  PAYSTACK_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM,
  PORT = 10000,
} = process.env;

// ─────────────────────────────────────────────
// IN-MEMORY IDEMPOTENCY STORE
// Replace Map with Redis/DB calls in production
// ─────────────────────────────────────────────
const processedEvents = new Map(); // eventId -> timestamp

function isAlreadyProcessed(eventId) {
  return processedEvents.has(eventId);
}

function markAsProcessed(eventId) {
  processedEvents.set(eventId, Date.now());

  // Evict entries older than 24 hours to prevent unbounded growth
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, ts] of processedEvents.entries()) {
    if (ts < cutoff) processedEvents.delete(id);
  }
}

// ─────────────────────────────────────────────
// EMAIL (Nodemailer)
// ─────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await mailer.sendMail({ from: EMAIL_FROM, to, subject, text, html });
    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

// ─────────────────────────────────────────────
// SMS (Twilio — only if credentials are set)
// ─────────────────────────────────────────────
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
  const twilio = require("twilio");
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

async function sendSMS({ to, body }) {
  if (!twilioClient) {
    console.warn("SMS skipped — Twilio credentials not configured.");
    return;
  }
  if (!to) {
    console.warn("SMS skipped — no phone number available.");
    return;
  }
  try {
    const msg = await twilioClient.messages.create({ from: TWILIO_FROM, to, body });
    console.log("SMS sent:", msg.sid);
  } catch (err) {
    console.error("SMS send failed:", err.message);
  }
}

// ─────────────────────────────────────────────
// NOTIFICATION HELPERS
// ─────────────────────────────────────────────
async function notifyPaymentSuccess(data) {
  const { reference, amount, currency, customer } = data;
  const email = customer?.email;
  const phone = customer?.phone;
  const name = customer?.first_name || "Customer";
  const formattedAmount = `${currency} ${(amount / 100).toFixed(2)}`;

  console.log(`[charge.success] ref=${reference} amount=${formattedAmount} customer=${email}`);

  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: "Payment Confirmed ✅",
      text: `Hi ${name}, your payment of ${formattedAmount} was successful. Reference: ${reference}.`,
      html: `
        <h2>Payment Confirmed ✅</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your payment of <strong>${formattedAmount}</strong> was received successfully.</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p>Thank you for your business!</p>
      `,
    }),
    sendSMS({
      to: phone,
      body: `Hi ${name}, your payment of ${formattedAmount} was successful. Ref: ${reference}. Thank you!`,
    }),
  ]);
}

async function notifyTransferSuccess(data) {
  const { reference, amount, currency, recipient } = data;
  const email = recipient?.details?.account_name;
  const formattedAmount = `${currency} ${(amount / 100).toFixed(2)}`;

  console.log(`[transfer.success] ref=${reference} amount=${formattedAmount}`);

  await sendEmail({
    to: process.env.BUSINESS_ALERT_EMAIL || EMAIL_FROM,
    subject: "Transfer Successful 💸",
    text: `Transfer of ${formattedAmount} completed. Reference: ${reference}.`,
    html: `
      <h2>Transfer Successful 💸</h2>
      <p>A transfer of <strong>${formattedAmount}</strong> was completed.</p>
      <p><strong>Reference:</strong> ${reference}</p>
    `,
  });
}

async function notifyTransferFailed(data) {
  const { reference, amount, currency, reason } = data;
  const formattedAmount = `${currency} ${(amount / 100).toFixed(2)}`;

  console.warn(`[transfer.failed] ref=${reference} reason=${reason}`);

  await sendEmail({
    to: process.env.BUSINESS_ALERT_EMAIL || EMAIL_FROM,
    subject: "⚠️ Transfer Failed",
    text: `Transfer of ${formattedAmount} failed. Reference: ${reference}. Reason: ${reason}.`,
    html: `
      <h2>⚠️ Transfer Failed</h2>
      <p>A transfer of <strong>${formattedAmount}</strong> has failed.</p>
      <p><strong>Reference:</strong> ${reference}</p>
      <p><strong>Reason:</strong> ${reason || "Unknown"}</p>
      <p>Please review your Paystack dashboard.</p>
    `,
  });
}

async function notifySubscriptionCreated(data) {
  const { plan, customer, next_payment_date } = data;
  const email = customer?.email;
  const name = customer?.first_name || "Customer";
  const planName = plan?.name || "your plan";

  console.log(`[subscription.create] customer=${email} plan=${planName}`);

  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: "Subscription Activated 🎉",
      text: `Hi ${name}, your subscription to ${planName} is now active. Next billing: ${next_payment_date}.`,
      html: `
        <h2>Subscription Activated 🎉</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You're now subscribed to <strong>${planName}</strong>.</p>
        <p><strong>Next billing date:</strong> ${next_payment_date || "N/A"}</p>
        <p>Thank you for subscribing!</p>
      `,
    }),
    sendSMS({
      to: customer?.phone,
      body: `Hi ${name}, your ${planName} subscription is now active. Next billing: ${next_payment_date}.`,
    }),
  ]);
}

async function notifySubscriptionDisabled(data) {
  const { plan, customer } = data;
  const email = customer?.email;
  const name = customer?.first_name || "Customer";
  const planName = plan?.name || "your plan";

  console.log(`[subscription.disable] customer=${email} plan=${planName}`);

  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: "Subscription Cancelled",
      text: `Hi ${name}, your subscription to ${planName} has been cancelled.`,
      html: `
        <h2>Subscription Cancelled</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your subscription to <strong>${planName}</strong> has been cancelled.</p>
        <p>If this was a mistake, please contact us or re-subscribe at any time.</p>
      `,
    }),
    sendSMS({
      to: customer?.phone,
      body: `Hi ${name}, your ${planName} subscription has been cancelled. Contact us if you need help.`,
    }),
  ]);
}

// ─────────────────────────────────────────────
// SIGNATURE VERIFICATION
// ─────────────────────────────────────────────
function verifyPaystackSignature(req) {
  const signature = req.headers["x-paystack-signature"];
  if (!signature || !req.rawBody) return false;

  let sigBuf, expectedBuf;
  try {
    const expected = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    sigBuf = Buffer.from(signature, "hex");
    expectedBuf = Buffer.from(expected, "hex");
  } catch {
    return false;
  }

  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

// ─────────────────────────────────────────────
// EXPRESS APP
// ─────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(morgan("combined"));

// Rate limit all routes EXCEPT the webhook
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use((req, res, next) => {
  if (req.path.startsWith("/paystack/webhook")) return next();
  generalLimiter(req, res, next);
});

// Raw body capture for HMAC verification
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ─────────────────────────────────────────────
// WEBHOOK ROUTE
// ─────────────────────────────────────────────
app.post("/paystack/webhook", async (req, res) => {
  // 1. Verify signature
  if (!verifyPaystackSignature(req)) {
    console.warn("Webhook rejected: invalid signature");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body?.event;
  const data = req.body?.data;

  // Use Paystack's idempotency key if present, else fall back to reference
  const eventId = req.headers["x-paystack-idempotency-key"] || data?.reference || data?.id;

  if (!event || !data) {
    console.warn("Webhook rejected: missing event or data");
    return res.status(400).send("Bad payload");
  }

  // 2. Idempotency check — respond 200 immediately for duplicates
  if (eventId && isAlreadyProcessed(eventId)) {
    console.log(`Duplicate event ignored: ${eventId}`);
    return res.sendStatus(200);
  }

  // 3. Acknowledge Paystack immediately (within 5s SLA)
  res.sendStatus(200);

  // 4. Process asynchronously after responding
  try {
    switch (event) {
      case "charge.success":
        await notifyPaymentSuccess(data);
        break;

      case "transfer.success":
        await notifyTransferSuccess(data);
        break;

      case "transfer.failed":
        await notifyTransferFailed(data);
        break;

      case "subscription.create":
        await notifySubscriptionCreated(data);
        break;

      case "subscription.disable":
        await notifySubscriptionDisabled(data);
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    if (eventId) markAsProcessed(eventId);
  } catch (err) {
    // Don't re-send response — already sent 200 above
    console.error(`Error handling event [${event}]:`, err);
  }
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "Paystack Webhook", uptime: process.uptime() });
});

// ─────────────────────────────────────────────
// SERVER + GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully.`);
  server.closeAllConnections?.();
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
