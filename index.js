import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(bodyParser.json());

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", req.body);

  const tx = req.body?.[0]; // Helius sends an array of transactions
  if (!tx) {
    console.log("❌ No transaction data found.");
    return res.status(400).json({ message: "No transaction data found" });
  }

  const transfer = tx.tokenTransfers?.[0];
  console.log("🧾 Transfer object:", transfer);

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No token transfer found" });
  }

  const toAddress = transfer.toUserAccount;
  const tokenAmount = transfer.tokenAmount;
  const burnAddress = "martyburn1111111111111111111111111111111111";

  if (toAddress !== burnAddress) {
    console.log("ℹ️ Not a burn transfer, ignoring.");
    return res.status(200).json({ message: "Not a burn transaction" });
  }

  const amount =
    typeof tokenAmount === 'object'
      ? tokenAmount.uiAmountString || tokenAmount.amount || "Unknown"
      : tokenAmount || "Unknown";

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
});

app.get('/', (req, res) => {
  res.send('Marty Burn Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
