import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'YOUR_REAL_MARTY_MINT_HERE';
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

let totalBurned = 0;
const cooldownSet = new Set();

function formatNumber(num) {
  return num.toLocaleString('en-US');
}

app.post('/api/index', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));

  const tx = req.body[0];
  if (!tx || !tx.tokenTransfers || !Array.isArray(tx.tokenTransfers)) {
    console.log('❌ Invalid transaction format.');
    return res.sendStatus(400);
  }

  const transfer = tx.tokenTransfers.find(
    t =>
      t.toUserAccount === BURN_WALLET &&
      t.mint === MARTY_MINT
  );

  if (!transfer) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const sender = transfer.fromUserAccount;
  if (cooldownSet.has(sender)) {
    console.log(`⏳ Sender ${sender} is on cooldown.`);
    return res.sendStatus(200);
  }

  const uiAmount = transfer.tokenAmount.uiAmount;
  const signature = tx.signature || 'https://solscan.io/tx/UNKNOWN_SIGNATURE';
  const solscanUrl = `https://solscan.io/tx/${signature}`;

  totalBurned += uiAmount;
  const remainingToBurn = TARGET_BURN - totalBurned;

  const message = 
`🔥 Another $MARTY burn launched into the abyss of space! 🔥
🚀 Marty’s moon mission is right on schedule.

🔥 ${formatNumber(uiAmount)} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: ${formatNumber(TOTAL_SUPPLY)}
 • 🎯 Target Supply: ${formatNumber(TARGET_SUPPLY)}
 • 🧨 Target Burn: ${formatNumber(TARGET_BURN)}
 • 🔥 Burned So Far: ${formatNumber(totalBurned)}
 • 🧮 Still to Burn: ${formatNumber(Math.max(remainingToBurn, 0))}

🔗 View on SolScan: ${solscanUrl}`;

  try {
    const tgResponse = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`, {
      chat_id: TELEGRAM_CHAT_ID,
      animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/raw/main/marty%20blastoff%201080%20x%201080%20gif.gif',
      caption: message,
      parse_mode: 'HTML'
    });

    console.log('✅ Telegram response:', tgResponse.data);

    cooldownSet.add(sender);
    setTimeout(() => cooldownSet.delete(sender), 30 * 1000);
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Telegram error:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`🚀 Burn bot server is running on port ${port}`);
});
