import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Burn address currently being tracked
const BURN_ADDRESS = 'martyburn9999999999999999999999999999999999';

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", req.body);

  const body = req.body;

  // Try to extract transfer from tokenTransfers array
  const transfer = body?.[0]?.tokenTransfers?.[0];

  console.log("🧾 Transfer object:", transfer);

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const toAddress = transfer.toUserAccount;
  const tokenAmount = transfer.tokenAmount;
  const amount =
    tokenAmount?.uiAmountString ||
    tokenAmount?.uiAmount ||
    tokenAmount ||
    "Unknown";

  // Check if transfer was to the burn address
  if (toAddress === BURN_ADDRESS) {
    const message = `🔥 ${amount} $MARTY burned`;

    console.log("📤 Sending to Telegram:", message);

    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`;

    const telegramPayload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true',
      caption: message,
    };

    try {
      const telegramRes = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramPayload),
      });

      const result = await telegramRes.json();
      console.log("✅ Telegram response:", result);
    } catch (error) {
      console.error("❌ Failed to send Telegram message:", error);
    }
  } else {
    console.log("ℹ️ Not a burn transfer.");
  }

  res.status(200).json({ message: 'Webhook processed' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
