import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", JSON.stringify(req.body, null, 2));

  const payload = Array.isArray(req.body) ? req.body[0] : req.body;
  const transfer = payload?.tokenTransfers?.[0];

  console.log("🧾 Transfer object:", transfer);

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const toAddress = transfer.toUserAccount;
  const amount = transfer.tokenAmount?.uiAmountString ?? "Unknown";

  if (toAddress === 'martyburn9999999999999999999999999999999999') {
    const message = `🔥 ${amount} $MARTY burned`;
    console.log("📤 Sending to Telegram:", message);

    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`;

    const telegramPayload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      caption: message,
      animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true'
    };

    try {
      const telegramRes = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramPayload),
      });

      const result = await telegramRes.json();
      console.log("✅ Telegram response:", result);
      return res.json({ message: "Telegram message sent", result });
    } catch (error) {
      console.error("❌ Telegram send error:", error);
      return res.status(500).json({ message: "Telegram send failed", error });
    }
  } else {
    console.log("⚠️ Transfer not to burn address. Ignored.");
    return res.status(200).json({ message: "Not a burn transfer" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
