import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'PASTE_YOUR_REAL_MARTY_MINT_HERE';
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GIF_URL = 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true';

// Cooldown store
const cooldownStore = {};
const COOLDOWN_PERIOD_MS = 60 * 1000; // 60 seconds

function isOnCooldown(wallet) {
  const now = Date.now();
  if (!cooldownStore[wallet] || now - cooldownStore[wallet] > COOLDOWN_PERIOD_MS) {
    cooldownStore[wallet] = now;
    return false;
  }
  return true;
}

app.post('/api/index', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));

  const burnData = req.body.find((tx) =>
    tx.tokenTransfers?.some((tt) =>
      tt.toUserAccount === BURN_WALLET && tt.mint === MARTY_MINT
    )
  );

  if (!burnData) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.status(200).send('Ignored');
  }

  const transfer = burnData.tokenTransfers.find(
    (tt) => tt.toUserAccount === BURN_WALLET && tt.mint === MARTY_MINT
  );

  const fromWallet = transfer.fromUserAccount;
  if (isOnCooldown(fromWallet)) {
    console.log(`⚠️ Wallet ${fromWallet} is on cooldown. Ignoring.`);
    return res.status(200).send('Rate limited');
  }

  const amountBurned = transfer.tokenAmount.uiAmount;
  const burnedSoFar = 1_000_000_000 - transfer.tokenAmount.uiAmount; // You’ll eventually sum all burns instead
  const remaining = Math.max(0, TARGET_SUPPLY - (TOTAL_SUPPLY - burnedSoFar));

  const message = `🔥 Another Marty burn sent to the abyss of space itself! 🔥\n\n🚀 Marty’s moon launch is right on schedule!\n\n🔥 ${amountBurned} $MARTY burned\n🔥 Countdown to launch: ${remaining.toLocaleString()} tokens left\n\n🔗 View on SolScan`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      animation: GIF_URL,
      caption: message,
      parse_mode: 'Markdown'
    };

    const telegramRes = await axios.post(url, payload);
    console.log('✅ Telegram response:', telegramRes.data);
    res.status(200).send('Posted to Telegram');
  } catch (err) {
    console.error('❌ Telegram Error:', err.response?.data || err.message);
    res.status(500).send('Telegram failed');
  }
});

app.listen(port, () => {
  console.log(`🔥 Marty Burn Bot running on port ${port}`);
});
