import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Constants
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;
const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MONITORED_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';

// Rate limiting
const cooldowns = new Map();
const COOLDOWN_DURATION = 15 * 1000;

// Message formatting helper
function generateMessage(burnAmount, totalBurned) {
  const remainingToBurn = TARGET_BURN - totalBurned;
  const fireEmojiCount = Math.min(10, Math.max(1, Math.floor(burnAmount / 100)));

  const fireLine = `${'🔥'.repeat(fireEmojiCount)} Another $MARTY burn just vaporized into the void ${'🔥'.repeat(fireEmojiCount)}`;
  const statusLine = `🚀 The mission to the moon is full throttle.\n`;
  const amountLine = `🔥 ${burnAmount.toLocaleString()} $MARTY incinerated\n`;

  const intelBlock = `🧠 Mission Intel:
 • 🪐 Total Supply: ${TOTAL_SUPPLY.toLocaleString()}
 • 🎯 Target Supply: ${TARGET_SUPPLY.toLocaleString()}
 • 💥 Total Burn Target: ${TARGET_BURN.toLocaleString()}
 • 🔥 Burned So Far: ${totalBurned.toLocaleString()}
 • 🧮 Remaining to Burn: ${remainingToBurn.toLocaleString()}`;

  const footer = `\n🔗 View on SolScan`;

  return `${fireLine}\n${statusLine}\n${amountLine}\n${intelBlock}${footer}`;
}

// Store burned total
let burnedTotal = 0;

// Middleware
app.use(bodyParser.json());

// Webhook handler
app.post('/webhook', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));

  const burnEvent = req.body[0];
  const transfer = burnEvent.tokenTransfers?.[0];

  if (!transfer) {
    console.log('❌ No valid token transfer found.');
    return res.sendStatus(400);
  }

  if (
    transfer.toUserAccount !== BURN_WALLET ||
    transfer.mint !== MONITORED_MINT
  ) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const amount = transfer.tokenAmount?.uiAmount;
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.log('❌ Burned amount is NaN. Aborting message.');
    return res.sendStatus(200);
  }

  burnedTotal += amount;

  // Rate limit per IP
  const ip = req.ip;
  const now = Date.now();
  if (cooldowns.has(ip) && now - cooldowns.get(ip) < COOLDOWN_DURATION) {
    console.log(`⏳ Cooldown in effect for ${ip}`);
    return res.sendStatus(200);
  }
  cooldowns.set(ip, now);

  const message = generateMessage(amount, burnedTotal);

  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log('✅ Telegram message sent!');
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Marty burn bot listening on port ${PORT}`);
});
