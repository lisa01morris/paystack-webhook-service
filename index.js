import express from "express";
import crypto from "crypto";
import axios from "axios";
import mongoose from "mongoose";
import pino from "pino";

const app = express();
const logger = pino();

// Parse raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Connect to MongoDB (optional)
mongoose.connect(process.env.MONGO_URL).catch(err => {
  logger.error("MongoDB connection error:", err);
});

// Event model
const Event = mongoose.model("Event", new mongoose.Schema({
  event: String,
  reference: String,
  amount: Number,
  project: String,
  raw: Object,
  createdAt: { type: Date, default: Date.now }
}));

// Slack notify helper
async function notifySlack(message) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await axios.post(process.env.SLACK_WEBHOOK_URL, { text: message });
}

// Telegram notify helper
async function notifyTelegram(message) {
  if (!process.env.TELEGRAM_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message
  });
}

// Multi-project handlers
const handlers = {
  "cedipay": async (event) => {
    logger.info("Processing CediPay event");
  },
  "xpert-global": async (event) => {
    logger.info("Processing XPERT Global event");
  },
  "slipmint": async (event) => {
    logger.info("Processing SlipMint event");
  }
};

// Webhook route
app.post("/paystack/webhook", async (req, res) => {
  try {
    // Verify signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      logger.warn("Invalid signature");
      return res.sendStatus(401);
    }

    const event = req.body;
    const project = event.data?.metadata?.project;

    // Respond immediately to Paystack
    res.sendStatus(200);

    // Log event
    logger.info({
      event: event.event,
      reference: event.data?.reference,
      amount: event.data?.amount,
      project
    }, "Webhook received");

    // Save to DB
    await Event.create({
      event: event.event,
      reference: event.data?.reference,
      amount: event.data?.amount,
      project,
      raw: event
    });

    // Notify
    await notifySlack(`Payment event: ${event.event}`);
    await notifyTelegram(`Payment event: ${event.event}`);

    // Route to correct project
    if (handlers[project]) {
      await handlers[project](event);
    } else {
      logger.warn("Unknown project:", project);
    }

  } catch (err) {
    logger.error("Webhook error:", err);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Webhook running on port ${PORT}`));
