const express = require("express");
const crypto = require("crypto");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware: Security headers
app.use(helmet());

// Middleware: Logging
app.use(morgan("combined"));

// Middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use(limiter);

// Middleware: Capture raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Validate PAYSTACK_SECRET
const secret = process.env.PAYSTACK_SECRET;
if (!secret) {
  console.error("PAYSTACK_SECRET is not set. Please ensure it is configured.");
  process.exit(1); // Exit the application if the secret is not set
}

// Webhook route
app.post("/paystack/webhook", (req, res) => {
  try {
    console.log("Webhook received:", req.body);

    const signature = req.headers["x-paystack-signature"];
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== hash) {
      console.log("Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    // Process webhook data...
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Paystack Webhook Service Running");
});

// Start server
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server.");
  server.close(() => {
    console.log("HTTP server closed.");
  });
});

// Global Error Handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
