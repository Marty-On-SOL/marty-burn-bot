import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MARTY_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

let totalBurned = 0;
const cooldowns = new Map();
const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per wallet

app.post('/webhook', async (req, res) => {
  const data = req.body;
  console.log('✅ POST received:', JSON.stringify(data, null, 2));

  const tx = data[0];
  const transfer = tx?.tokenTransfers?.[0];

  if (!transfer || transfer.mint !== MARTY_MINT || transfer.toUserAccount !== 'martyburn9999999999999999999999999999999999') {
    console.log('❌ Not a valid burn transfer.');
    return res.status(400).send('Invalid transfer');
  }

  const userKey = transfer.fromUserAccount;
  const now = Date.now();
  if (cooldowns.has(userKey) && now - cooldowns.get(userKey) < COOLDOWN_MS) {
    console.log(`⛔ Rate limit: ${userKey} is on cooldown`);
    return res.status(429).send('Too many requests');
  }
  cooldowns.set(userKey, now);

  const amountBurned = transfer.tokenAmount.uiAmount;
  if (!amountBurned || isNaN(amountBurned)) {
    console.log('❌ Burned amount is NaN. Aborting message.');
    return res.status(400).send('Invalid burn amount');
  }

  totalBurned += amountBurned;
  const tokensRemaining = TARGET_BURN - totalBurned;

  const finalMessage = `🔥 Another $MARTY burn launched into the abyss of space! 🔥
🚀 Marty’s moon mission is right on schedule.

🔥 ${amountBurned.toLocaleString()} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: 1,000,000,000
 • 🎯 Target Supply: 690,420,000
 • 🧨 Target Burn: 309,580,000
 • 🔥 Burned So Far: ${totalBurned.toLocaleString()}
 • 🧮 Still to Burn: ${tokensRemaining.toLocaleString()}

🔗 View on SolScan`;

  const gifFileId = 'CgACAgQAAyEGAASouvG4AAIGo2hmEUs74VNB1U2OKlfZyVXYiyqoAAKmCAACySc0U9rMgpzy5P5KNgQ';

  try {
    const tgRes = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendAnimation`, {
      chat_id: CHAT_ID,
      animation: gifFileId,
      caption: finalMessage,
      parse_mode: 'Markdown'
    });
    console.log('✅ Telegram response:', tgRes.data);
    res.status(200).send('Message sent!');
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.message);
    res.status(500).send('Telegram error');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Marty burn bot listening on port ${PORT}`);
});
