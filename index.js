app.post('/api/index', async (req, res) => {
  console.log("✅ POST received:", req.body);

  const txArray = Array.isArray(req.body) ? req.body : [req.body];

  for (const tx of txArray) {
    const transfer = tx?.tokenTransfers?.[0];

    if (!transfer) {
      console.log("❌ No token transfer data found in one of the items.");
      continue;
    }

    const toAddress = transfer.toUserAccount;
    const amount = transfer.tokenAmount?.uiAmountString || "Unknown amount";

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
      } catch (error) {
        console.error("❌ Telegram send failed:", error);
      }
    } else {
      console.log("ℹ️ Skipped transfer to different address:", toAddress);
    }
  }

  res.status(200).json({ message: "Webhook processed" });
});
