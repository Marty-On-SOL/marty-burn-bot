import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Parse JSON request bodies
app.use(bodyParser.json());

// POST endpoint to receive webhook data
app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", JSON.stringify(req.body, null, 2));

  const body = req.body;

  // Support both object and array format from webhook
  const events = Array.isArray(body) ? body : [body];

  for (const event of events) {
    const transfer = event.tokenTransfers?.[0];

    console.log("🧾 Transfer object:", transfer);

    if (
      transfer &&
      transfer.toUserAccount === 'martyburn1111111111111111111111111111111111'
    ) {
      const rawAmount = transfer.tokenAmount?.uiAmountString || transfer.tokenAmount?.amount || "0";
      const amount = Math.floor(parseFloat(rawAmount)).toString();

      const message = `🔥 ${amount} $MARTY burned!`;

      const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendAnimation`;
      const telegramPayload = {
        chat_id: process.env.CHAT_ID,
        animation: 'https://martyburnbot.s3.amazonaws.com/marty-blastoff.gif',
        caption: message,
        parse_mode: 'HTML'
      };

      try {
        const telegramRes = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramPayload)
        });

        const result = await telegramRes.json();
        console.log("✅ Telegram response:", result);
      } catch (err) {
        console.error("❌ Telegram error:", err);
      }
    } else {
      console.log("❌ No valid token transfer to burn address.");
    }
  }

  res.status(200).json({ status: "received" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
