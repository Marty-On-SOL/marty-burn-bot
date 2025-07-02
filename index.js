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

  const transaction = req.body?.[0];
  const transfer = transaction?.tokenTransfers?.[0];

  console.log("🧾 Transfer object:", transfer);

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  console.log("🧪 Raw tokenAmount object:", transfer.tokenAmount);

  const toAddress = transfer.toUserAccount;
  let amount = "Unknown";

  if (typeof transfer.tokenAmount === 'number') {
    amount = transfer.tokenAmount.toString();
  } else if (typeof transfer.tokenAmount === 'object' && transfer.tokenAmount?.uiAmountString) {
    amount = transfer.tokenAmount.uiAmountString;
  }

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
      res.status(200).json({ message: "Telegram message sent", result });
    } catch (error) {
      console.error("❌ Telegram send failed:", error);
      res.status(500).json({ error: "Telegram send failed" });
    }
  } else {
    console.log("ℹ️ Transfer was not to the burn address.");
    res.status(200).json({ message: "Not a burn transfer" });
  }
});

app.get('/', (req, res) => {
  res.send('🔥 Marty Burn Bot is live!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
