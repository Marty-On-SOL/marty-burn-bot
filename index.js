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

  const transactions = Array.isArray(req.body) ? req.body : [req.body];

  let sentMessage = false;

  for (const tx of transactions) {
    const transfer = tx?.tokenTransfers?.[0];

    console.log("🧾 Transfer object:", transfer);

    if (!transfer) {
      console.log("❌ No token transfer data found in this transaction.");
      continue;
    }

    const toAddress = transfer.toUserAccount;
    const amount = transfer.tokenAmount?.uiAmountString || "Unknown";

    if (toAddress === 'martyburn9999999999999999999999999999999999') {
      const message = `🔥 ${amount} $MARTY burned`;

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
        sentMessage = true;
      } catch (error) {
        console.error("❌ Telegram send failed:", error);
      }
    } else {
      console.log("ℹ️ Skipping non-burn transfer.");
    }
  }

  if (sentMessage) {
    res.status(200).json({ message: "Telegram message(s) sent" });
  } else {
    res.status(200).json({ message: "No relevant transfers found" });
  }
});

app.get('/', (req, res) => {
  res.send('🔥 Marty Burn Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
