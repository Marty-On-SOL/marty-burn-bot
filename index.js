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

  if (!Array.isArray(req.body)) {
    console.log("❌ Payload is not an array.");
    return res.status(400).json({ message: "Expected array payload from Helius" });
  }

  for (const item of req.body) {
    const transfers = item.transaction?.tokenTransfers || [];

    const burnTransfers = transfers.filter(transfer =>
      transfer.toUserAccount === 'martyburn9999999999999999999999999999999999'
    );

    for (const transfer of burnTransfers) {
      const amount = transfer.tokenAmount?.uiAmountString || "Unknown";
      const symbol = transfer.tokenSymbol || "tokens";
      const message = `🔥 ${amount} ${symbol} burned`;

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
      } catch (error) {
        console.error("❌ Telegram send failed:", error);
      }
    }
  }

  res.status(200).json({ message: "Webhook processed" });
});

app.get('/', (req, res) => {
  res.send('Marty Burn Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
