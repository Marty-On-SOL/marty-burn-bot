import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", req.body);

  const transfer = req.body?.transaction?.events?.tokenTransfers?.[0];
  console.log("🧾 Transfer object:", transfer);

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const mint = transfer.mint;
  const toAddress = transfer.toUserAccount;
  const tokenAmount = transfer.tokenAmount;
  const amount = tokenAmount?.uiAmountString;

  if (!amount) {
    console.log("⚠️ tokenAmount object missing or incomplete:", tokenAmount);
  }

  if (
    toAddress === 'martyburn9999999999999999999999999999999999'
  ) {
    const message = `🔥 ${amount || "Unknown"} $MARTY burned`;

    console.log("📤 Sending to Telegram:", message);

    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramPayload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    };

    try {
      const telegramRes = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramPayload),
      });

      const result = await telegramRes.json();
      console.log("✅ Telegram response:", result);

      res.status(200).json({ message: "Telegram message sent", result });
    } catch (error) {
      console.error("❌ Telegram send failed:", error);
      res.status(500).json({ error: "Telegram send failed" });
    }
  } else {
    console.log("ℹ️ Transfer ignored — not sent to burn address.");
    res.status(200).json({ message: "Transfer not to burn address" });
  }
});

app.get('/', (req, res) => {
  res.send('🔥 Marty Burn Bot is online!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
