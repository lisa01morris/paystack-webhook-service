const express = require("express");
const crypto = require("crypto");

const app = express();

// Capture raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Webhook route
app.post("/paystack/webhook", (req, res) => {
  console.log("Webhook received:", req.body);

  // Optional: verify signature
  const secret = process.env.PAYSTACK_SECRET;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.rawBody)
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];

  if (secret && signature && hash !== signature) {
    console.log("Invalid signature");
    return res.status(400).send("Invalid signature");
  }

  // Respond immediately
  res.sendStatus(200);
});

// Health check
app.get("/", (req, res) => {
  res.send("Paystack Webhook Service Running");
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
