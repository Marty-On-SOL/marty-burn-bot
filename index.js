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

  const transfers = req.body?.transaction?.tokenTransfers || [];

  if (transfers.length === 0) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const burnTransfers = transfers.filter(transfer =>
    transfer.toUserAccount === 'martyburn9999999999999999999999999999999999'
  );

  if (burnTransfers.length === 0) {
    console.log("❌ No burn transfers to monitored address.");
    return res.status(200).json({ message: "No relevant burn transfers" });
  }

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

  res.status(200).json({ message: "Telegram burn messages processed" });
});

app.get('/', (req, res) => {
  res.send('Marty Burn Bot is running (agnostic mode)!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
