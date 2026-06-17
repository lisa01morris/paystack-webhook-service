# Deployment Guide: Paystack Webhook Service on Render

This guide walks you through deploying the Paystack Webhook Service to [Render](https://render.com).

## Prerequisites

- A Render account (free tier available)
- Paystack secret key from your [Paystack dashboard](https://dashboard.paystack.com/)
- SMTP credentials (email service)
- Optional: Twilio credentials (for SMS notifications)

---

## Step 1: Deploy to Render

### 1.1 Connect Your Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Select **"Build and deploy from a Git repository"**
4. Connect your GitHub account and select `paystack-webhook-service`

### 1.2 Configure the Service
- **Name**: `paystack-webhook-service` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or Starter for production)

---

## Step 2: Set Up Environment Variables

This is the **critical step** that most deployments fail at. Your app requires **all** of these variables:

### 2.1 Required Variables (Must Have)

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYSTACK_SECRET` | Your Paystack secret key | `sk_live_xxxxxxxxxxxxx` |
| `SMTP_HOST` | Email service host | `smtp.gmail.com` |
| `SMTP_PORT` | Email service port | `587` |
| `SMTP_USER` | Email address | `your-email@gmail.com` |
| `SMTP_PASS` | Email app password | (see below) |
| `EMAIL_FROM` | Sender email address | `noreply@yourcompany.com` |

### 2.2 How to Add Environment Variables on Render

1. In your Render service page, go to **"Environment"**
2. Click **"Add Environment Variable"** for each variable:

```
PAYSTACK_SECRET = sk_live_your_actual_key
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-app-password
EMAIL_FROM = noreply@yourcompany.com
```

3. Click **"Save"** (Render will auto-redeploy)

---

## Step 3: Get Your SMTP Credentials

### Option A: Gmail (Free)

1. Enable **2-Factor Authentication** on your Google Account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Find **"App passwords"** section
4. Select **Mail** and **Windows Computer** (or your device)
5. Google will generate a 16-character password
6. Use this as your `SMTP_PASS` (without spaces)

**Values to use:**
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = xxxx xxxx xxxx xxxx (remove spaces)
EMAIL_FROM = your-email@gmail.com
```

### Option B: Other Email Services

**SendGrid:**
```
SMTP_HOST = smtp.sendgrid.net
SMTP_PORT = 587
SMTP_USER = apikey
SMTP_PASS = SG.xxxxxxxxxxxxx (your SendGrid API key)
```

**Mailgun:**
```
SMTP_HOST = smtp.mailgun.org
SMTP_PORT = 587
SMTP_USER = postmaster@yourdomain.com
SMTP_PASS = your-mailgun-password
```

---

## Step 4: Get Your Paystack Credentials

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to **Settings** → **API Keys & Webhooks**
3. Under **API Keys**, find your **Secret Key** (starts with `sk_live_` or `sk_test_`)
4. Copy it and add to Render as `PAYSTACK_SECRET`

**⚠️ Important:** Use your **Live** key for production, **Test** key for development.

---

## Step 5: (Optional) SMS Notifications with Twilio

If you want SMS notifications for payment alerts:

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your credentials from the dashboard:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (your Twilio number)

3. Add to Render environment:
```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = your-auth-token
TWILIO_FROM = +1234567890
```

**Note:** Without these, SMS notifications will be skipped automatically.

---

## Step 6: Configure Paystack Webhooks

Now that your service is deployed, add it to Paystack:

1. Get your Render service URL (e.g., `https://paystack-webhook-service.onrender.com`)
2. Go to [Paystack Dashboard](https://dashboard.paystack.com/) → **Settings** → **API Keys & Webhooks**
3. Under **Webhooks**, add:
   - **URL**: `https://your-service-url.onrender.com/paystack/webhook`
   - **Select Events**: Choose which events to listen to (e.g., charge.success, transfer.success)

---

## Step 7: Test Your Deployment

### Check if the service is running:
```bash
curl https://your-service-url.onrender.com/
```

You should get:
```json
{"status":"ok","service":"Paystack Webhook","uptime":123.45}
```

### Monitor logs on Render:
1. Go to your Render service
2. Click **"Logs"** tab
3. You'll see real-time application logs

---

## Common Issues & Troubleshooting

### ❌ "Missing required env variable: SMTP_HOST"

**Cause:** You didn't add all required environment variables.

**Fix:**
1. Go to **Environment** on your Render service
2. Verify all 6 required variables are present (use the table in Step 2.1)
3. Check for typos
4. Click **"Save"** to trigger redeploy

### ❌ "SMTP Error: Invalid Credentials"

**Cause:** Wrong email password or app-specific password not generated.

**Fix for Gmail:**
- Ensure you have 2FA enabled
- Regenerate your [app password](https://myaccount.google.com/apppasswords)
- Remove any spaces from the 16-character password
- Update `SMTP_PASS` on Render

### ❌ Webhook not receiving events

**Cause:** Webhook not configured in Paystack or using wrong URL.

**Fix:**
1. Verify your Paystack webhook URL includes `/paystack/webhook`
2. Test by triggering a test transaction in Paystack dashboard
3. Check Render logs for incoming requests

### ❌ Service crashes on startup

**Fix:**
1. Check the Render logs for the specific error
2. Ensure PORT environment variable is not conflicting (default: 10000)
3. Verify all REQUIRED variables are set (they will crash if missing)

---

## Environment Variables Reference

```bash
# REQUIRED - Service crashes without these
PAYSTACK_SECRET=sk_live_xxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@company.com

# OPTIONAL - Nice to have but not required
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM=+1234567890
BUSINESS_ALERT_EMAIL=alerts@company.com
PORT=10000
NODE_ENV=production
LOG_LEVEL=info
```

---

## Next Steps

- Monitor your Render logs for incoming webhooks
- Set up error alerts in Render (optional)
- For production, consider upgrading from Free to Starter plan for better uptime
- Keep your Paystack secret key secure (never commit to git)

---

## Need Help?

- [Render Documentation](https://render.com/docs)
- [Paystack Webhooks Guide](https://paystack.com/blog/webhooks)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
