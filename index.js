const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('Webhook service is running');
});

// Paystack webhook
app.post('/paystack/webhook', (req, res) => {
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.sendStatus(401);
    }

    const event = req.body;

    console.log("Event:", event.event);

    if (event.event === "charge.success") {
        console.log("Payment successful:", event.data);
    }

    res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
