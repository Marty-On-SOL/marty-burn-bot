import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'YOUR_MARTY_MINT_HERE'; // Replace with real mint when available
const TARGET_SUPPLY = 690420000;

app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", JSON.stringify(req.body, null, 2));

  const transfer = req.body?.[0]?.tokenTransfers?.[0];
  const signature = req.body?.[0]?.signature;

  console.log("🧾 Transfer object:", transfer);

  if (!transfer || transfer.toUserAccount !== BURN_WALLET || transfer.mint !== MARTY_MINT) {
    console.log("❌ Not a valid $MARTY burn to burn wallet.");
    return res.status(200).json({ message: "Ignored non-burn transfer" });
  }

  const amount = transfer.tokenAmount?.uiAmountString || "Unknown";
  const txLink = `https://solscan.io/tx/${signature}`;
  const burnedAmount = parseFloat(transfer.tokenAmount?.uiAmount || 0);
  const countdown = Math.max(0, TARGET_SUPPLY - burnedAmount);

  const message = `Another $MARTY burn sent to the abyss of space itself! 🔥🔥🔥\n` +
                  `Marty’s moon launch is right on schedule! 🚀\n\n` +
                  `🔥 ${amount} $MARTY burned\n` +
                  `🚀 ${countdown.toLocaleString()} tokens left until lift-off at ${TARGET_SUPPLY.toLocaleString()}!\n\n` +
                  `🌐 [View TX on Solscan](${txLink})`;

  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`;

  const telegramPayload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true',
    caption: message,
    parse_mode: "Markdown"
  };

  try {
    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramPayload),
    });

    const result = await telegramRes.json();
    console.log("✅ Telegram response:", result);
    res.status(200).json({ message: "Telegram notification sent", result });
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error);
    res.status(500).json({ message: "Telegram send failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
