# paystack-webhook-service

A reliable and reusable webhook infrastructure for managing Paystack payment events across any application.

## Features

✅ **Secure Webhook Handling** - HMAC-SHA512 signature verification  
✅ **Idempotency** - Automatic duplicate event detection  
✅ **Multi-Channel Notifications** - Email & SMS alerts  
✅ **Rate Limiting** - Built-in protection against abuse  
✅ **Graceful Shutdown** - Clean server termination  
✅ **Multiple Event Types** - charge.success, transfer.success/failed, subscription events  
✅ **Production-Ready** - Helmet security, Morgan logging, Express best practices  

## Supported Events

- `charge.success` - Payment completed
- `transfer.success` - Transfer completed successfully
- `transfer.failed` - Transfer failed
- `subscription.create` - Subscription activated
- `subscription.disable` - Subscription cancelled

## Project Structure

```
paystack-webhook-service/
├── index.js                 # Main application entry point
├── package.json             # Project dependencies & scripts
├── package-lock.json        # Locked dependency versions
├── .env.example             # Environment variables template
├── .env                     # Local environment variables (not in git)
├── .gitignore              # Git ignore rules
├── .github/                # GitHub configuration
│   └── workflows/          # GitHub Actions workflows
├── config/                 # Configuration files
│   ├── paystack.js        # Paystack API client & configuration
│   ├── email.js           # Email service configuration
│   └── twilio.js          # Twilio SMS configuration (optional)
├── middleware/            # Express middleware
│   ├── auth.js            # Webhook signature verification
│   ├── errorHandler.js    # Error handling middleware
│   └── rateLimit.js       # Rate limiting middleware
├── utils/                 # Utility functions
│   ├── logger.js          # Logging utility
│   ├── validators.js      # Validation functions
│   └── helpers.js         # Helper functions
├── README.md              # This file
├── DEPLOYMENT_GUIDE.md    # Render deployment instructions
├── SECURITY.md            # Security best practices
├── LICENSE                # MIT License
└── docs/                  # Additional documentation
    ├── API.md             # API endpoint documentation
    ├── WEBHOOK_EVENTS.md  # Webhook event types & payloads
    └── TROUBLESHOOTING.md # Common issues & solutions
```

### File Descriptions

#### Core Files
- **`index.js`** - Express server setup, webhook handler, event processors
- **`package.json`** - Dependencies (express, dotenv, nodemailer, etc.)

#### Configuration (`/config`)
- **`paystack.js`** - Paystack API initialization and verification
- **`email.js`** - SMTP configuration and email sending
- **`twilio.js`** - SMS service configuration (optional)

#### Middleware (`/middleware`)
- **`auth.js`** - HMAC-SHA512 signature verification
- **`errorHandler.js`** - Global error handling
- **`rateLimit.js`** - Request rate limiting (100 req/15 min)

#### Utilities (`/utils`)
- **`logger.js`** - Structured logging
- **`validators.js`** - Input validation
- **`helpers.js`** - Common helper functions

#### Documentation
- **`DEPLOYMENT_GUIDE.md`** - Step-by-step Render deployment
- **`SECURITY.md`** - Environment variable security practices
- **`docs/API.md`** - Endpoint documentation
- **`docs/WEBHOOK_EVENTS.md`** - Event payload examples

---

## Quick Start

### Prerequisites

- Node.js 16+
- SMTP credentials (Gmail, Hostinger, SendGrid, etc.)
- Paystack API secret key
- (Optional) Twilio account for SMS notifications

### Installation

```bash
git clone https://github.com/lisa01morris/paystack-webhook-service.git
cd paystack-webhook-service
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials:
   ```env
   PAYSTACK_SECRET=sk_live_your_secret_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=info@globalpresses.com
   SMTP_PASS=your-gmail-app-password
   EMAIL_FROM=info@luckmanworld.icu
   BUSINESS_ALERT_EMAIL=info@luckmanworld.icu
   ```

3. Start the service:
   ```bash
   npm start
   ```

Your webhook service is now running on `http://localhost:10000`

## Deployment

### Deploy to Render

📖 **See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete step-by-step instructions.

**Your Live Service:** https://paystack-webhook-service.onrender.com

**Quick summary:**
1. Push to GitHub
2. Create new Web Service on Render
3. Set all required environment variables (see DEPLOYMENT_GUIDE.md)
4. Deploy

## Environment Variables

### Required ⚠️

| Variable | Description |
|----------|-------------|
| `PAYSTACK_SECRET` | Your Paystack secret key |
| `SMTP_HOST` | Email server hostname |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email account |
| `SMTP_PASS` | Email password |
| `EMAIL_FROM` | Sender email address |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 10000 |
| `NODE_ENV` | Environment | production |
| `TWILIO_ACCOUNT_SID` | Twilio account ID | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - |
| `TWILIO_FROM` | Twilio phone number | - |
| `BUSINESS_ALERT_EMAIL` | Alert email for transfers | EMAIL_FROM |

## API Endpoints

### POST `/paystack/webhook`

Receives Paystack webhook events. Requires valid HMAC signature.

**Headers:**
```
x-paystack-signature: <hmac-sha512-hex>
```

**Response:**
- `200` - Event accepted (successful signature verification)
- `400` - Invalid signature or malformed payload

### GET `/`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "Paystack Webhook",
  "uptime": 1234.56
}
```

## Development

### Run in watch mode

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### View logs

```bash
npm logs
```

## Security Considerations

- ✅ All webhooks require HMAC-SHA512 signature verification
- ✅ Rate limiting prevents abuse (100 requests per 15 minutes)
- ✅ Helmet adds HTTP security headers
- ✅ Timing-safe comparison for signature validation
- ✅ Environment variables never logged
- 🔒 Always use `sk_live_` keys in production

**See [SECURITY.md](./SECURITY.md) for detailed security practices.**

## Email Setup Guide

### Gmail
1. Enable **2-Factor Authentication** on Google Account
2. Generate [app password](https://myaccount.google.com/apppasswords)
3. Use the 16-character password as `SMTP_PASS`

**Values:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx (without spaces)
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-mailgun-password
```

## Configuring Paystack Webhooks

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to Settings → API Keys & Webhooks
3. Add your webhook URL: `https://paystack-webhook-service.onrender.com/paystack/webhook`
4. Select events you want to receive
5. Save

## Troubleshooting

**Service crashes on startup?**
- Check that all REQUIRED environment variables are set
- Run `node index.js` directly to see the error message

**Webhooks not working?**
- Verify PAYSTACK_SECRET matches your Paystack dashboard
- Check that webhook URL in Paystack settings is correct
- Verify HMAC signature validation isn't failing (check logs)

**Emails not sending?**
- Check SMTP credentials are correct
- For Gmail: ensure 2FA is enabled and app password is used
- Check email logs in Render dashboard

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) and [SECURITY.md](./SECURITY.md) for more troubleshooting.

## Architecture

```
POST /paystack/webhook
    ↓
1. Verify HMAC-SHA512 signature
    ↓
2. Check idempotency (duplicate detection)
    ↓
3. Return 200 OK immediately (Paystack SLA: 5s)
    ↓
4. Process asynchronously:
   - Determine event type
   - Send email notifications
   - Send SMS notifications (if configured)
   - Log events
```

## Tech Stack

- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Email:** Nodemailer
- **SMS:** Twilio (optional)
- **Security:** Helmet, Express Rate Limit
- **Logging:** Morgan
- **Environment:** dotenv
- **Deployment:** Render

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please open an [issue on GitHub](https://github.com/lisa01morris/paystack-webhook-service/issues).

---

**Deploy now:** [See DEPLOYMENT_GUIDE.md for Render setup →](./DEPLOYMENT_GUIDE.md)

**Your service is live at:** https://paystack-webhook-service.onrender.com
