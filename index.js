import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", req.body);

  const data = Array.isArray(req.body) ? req.body[0] : req.body;
  const transfer = data.tokenTransfers?.[0];

  console.log("🧾 Transfer object:", transfer);

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const toAddress = transfer.toUserAccount;
  const amount = transfer.tokenAmount?.uiAmountString || "Unknown";
  const burnAddress = 'martyburn1111111111111111111111111111111111';

  if (toAddress !== burnAddress) {
    console.log(`⚠️ Transfer not to burn address (${burnAddress}), skipping.`);
    return res.status(200).json({ message: "Not a burn transfer" });
  }

  const message = `🔥 ${amount} $MARTY burned`;
  const animationUrl = "https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true";

  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`;

  const telegramPayload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    caption: message,
    animation: animationUrl,
  };

  try {
    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramPayload),
    });

    const result = await telegramRes.json();
    console.log("✅ Telegram response:", result);
    res.status(200).json({ message: "Telegram message sent with GIF", result });
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
