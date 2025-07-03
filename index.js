import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MARTY_MINT = "DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump";

const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

let totalBurned = 0;

app.post('/webhook', async (req, res) => {
  console.log("✅ POST received:", JSON.stringify(req.body, null, 2));

  const event = req.body[0];
  const transfer = event?.tokenTransfers?.find(t =>
    t.toUserAccount === "martyburn9999999999999999999999999999999999" &&
    t.mint === MARTY_MINT
  );

  if (!transfer || !transfer.tokenAmount) {
    console.log("❌ No valid burn detected.");
    return res.status(200).send("No valid burn detected.");
  }

  const { uiAmount } = transfer.tokenAmount;

  if (typeof uiAmount !== 'number' || isNaN(uiAmount)) {
    console.log("❌ Burned amount is NaN. Aborting message.");
    return res.status(400).send("Invalid amount.");
  }

  totalBurned += uiAmount;
  const stillToBurn = TARGET_BURN - totalBurned;

  const message = `🔥 Another $MARTY burn launched into the abyss of space! 🔥
🚀 Marty’s moon mission is right on schedule.

🔥 ${uiAmount.toLocaleString()} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: ${TOTAL_SUPPLY.toLocaleString()}
 • 🎯 Target Supply: ${TARGET_SUPPLY.toLocaleString()}
 • 🧨 Target Burn: ${TARGET_BURN.toLocaleString()}
 • 🔥 Burned So Far: ${totalBurned.toLocaleString()}
 • 🧮 Still to Burn: ${stillToBurn.toLocaleString()}

🔗 View on SolScan`;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });

    console.log("✅ Telegram message sent.");
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error.message);
    res.status(500).send("Telegram error.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
