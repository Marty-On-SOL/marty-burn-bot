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

  const transfer = req.body?.transaction?.tokenTransfers?.[0];

  if (!transfer) {
    console.log("❌ No token transfer data found.");
    return res.status(400).json({ message: "No transfer data found" });
  }

  const mint = transfer.mint;
  const toAddress = transfer.toUserAccount;

  if (
    mint === 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump' &&
    toAddress === 'martyburn9999999999999999999999999999999999'
  ) {
    const amount = transfer.tokenAmount?.uiAmountString || "Unknown amount";
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

      return res.status(200).json({ message: "Telegram message sent", result });
    } catch (error) {
      console.error("❌ Telegram send failed:", error);
      return res.status(500).json({ error: "Telegram send failed" });
    }
  } else {
    console.log("ℹ️ Transfer did not match mint or burn address criteria.");
    return res.status(200).json({ message: "Ignored: not a burn transfer" });
  }
});

app.get('/', (req, res) => {
  res.send('Marty Burn Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
