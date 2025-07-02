import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", req.body);

  const transfer = req.body.transaction?.events?.tokenTransfers?.[0];

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const amount = transfer.tokenAmount?.uiAmountString || "Unknown amount";
  const message = `🔥 ${amount} $MARTY burned`;

  console.log("📤 Sending to Telegram:", message);

  const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

  const telegramPayload = {
    chat_id: process.env.CHAT_ID,
    text: message,
  };

  try {
    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramPayload)
    });

    const result = await telegramRes.json();
    console.log("✅ Telegram response:", result);

    res.status(200).json({ message: "Telegram message sent", result });
  } catch (error) {
    console.error("❌ Telegram send failed:", error);
    res.status(500).json({ error: "Telegram send failed" });
  }
});

app.get('/', (req, res) => {
  res.send('Marty Burn Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
