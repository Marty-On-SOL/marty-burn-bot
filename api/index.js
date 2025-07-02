export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  console.log("Received POST:", req.body);

  const transaction = req.body.transaction;
  console.log("Full transaction object:", transaction);

  const transfer = transaction?.events?.tokenTransfers?.[0];
  if (!transfer) {
    console.log("❌ No transfer data found.");
    return res.status(400).json({ message: 'No transfer data found' });
  }

  const amount = transfer.tokenAmount?.uiAmountString || "Unknown amount";
  const message = `🔥 ${amount} $MARTY burned`;

  console.log("📤 Sending Telegram message:", message);

  const telegramUrl = `https://api.telegram.org/bot7903162757:AAHVGGvt8dK09xVNKkHp-d_gy-ZUbYkqQs0/sendMessage`;

  const telegramPayload = {
    chat_id: "-1002830823864",
    text: message,
  };

  try {
    const telegramRes = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telegramPayload),
    });

    const result = await telegramRes.json();
    console.log("✅ Telegram API response:", result);

    res.status(200).json({ message: "Telegram message sent" });
  } catch (error) {
    console.error("❌ Telegram send error:", error);
    res.status(500).json({ error: "Failed to send Telegram message" });
  }
}
