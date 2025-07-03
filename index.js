import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const TEMP_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN_AMOUNT = TOTAL_SUPPLY - TARGET_SUPPLY;

const cooldowns = new Map();
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 seconds

app.post('/api/index', async (req, res) => {
  const data = req.body;
  console.log('✅ POST received:', JSON.stringify(data, null, 2));

  const event = data[0];
  const transfer = event?.tokenTransfers?.[0];
  const signature = event?.signature || 'N/A';

  if (
    !transfer ||
    transfer.mint !== TEMP_MINT ||
    transfer.toUserAccount !== BURN_WALLET
  ) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const sender = transfer.fromUserAccount;
  const now = Date.now();

  if (cooldowns.has(sender)) {
    const lastUsed = cooldowns.get(sender);
    if (now - lastUsed < COOLDOWN_DURATION_MS) {
      console.log(`⏳ Cooldown active for ${sender}`);
      return res.sendStatus(200);
    }
  }
  cooldowns.set(sender, now);

  const burnedAmount = Number(transfer.tokenAmount.uiAmount);
  const burnedSoFar = burnedAmount; // Update if storing actual total burn
  const remainingToBurn = TARGET_BURN_AMOUNT - burnedSoFar;

  const caption = `🔥 Another $MARTY burn launched into the abyss of space! 🔥
🚀 Marty’s moon mission is right on schedule.

🔥 ${burnedAmount.toLocaleString()} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: 1,000,000,000
 • 🎯 Target Supply: 690,420,000
 • 🧨 Target Burn: 309,580,000
 • 🔥 Burned So Far: ${burnedSoFar.toLocaleString()}
 • 🧮 Still to Burn: ${remainingToBurn.toLocaleString()}

🔗 View on SolScan`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;
    const animationUrl = 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true';

    const response = await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      animation: animationUrl,
      caption: caption,
      parse_mode: 'Markdown'
    });

    console.log('✅ Telegram response:', response.data);
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
