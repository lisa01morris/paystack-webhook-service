services:
  - type: web
    name: paystack-webhook-service
    env: node
    region: oregon
    plan: free   # upgrade to starter/standard for production
    branch: main

    buildCommand: "npm install"
    startCommand: "node index.js"

    envVars:
      - key: PORT
        value: 10000   # Render injects PORT automatically; your code uses process.env.PORT

      - key: PAYSTACK_SECRET
        sync: false    # Add in Render dashboard

      - key: MONGO_URL
        sync: false    # Add your MongoDB connection string

      - key: SLACK_WEBHOOK_URL
        sync: false

      - key: TELEGRAM_TOKEN
        sync: false

      - key: TELEGRAM_CHAT_ID
        sync: false
