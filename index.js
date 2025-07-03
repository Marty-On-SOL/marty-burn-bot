import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BURN_ADDRESS = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

let totalBurned = 0;
const cooldownWallets = new Map();

app.post('/api/index', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));

  const data = req.body;
  const event = Array.isArray(data) ? data[0] : data;

  const transfer = event.tokenTransfers?.find(t =>
    t.toUserAccount === BURN_ADDRESS &&
    t.mint === MARTY_MINT
  );

  if (!transfer) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const sender = transfer.fromUserAccount;

  // Rate limiting
  if (cooldownWallets.has(sender)) {
    const cooldownUntil = cooldownWallets.get(sender);
    if (Date.now() < cooldownUntil) {
      console.log(`⏳ Sender ${sender} is on cooldown.`);
      return res.sendStatus(200);
    }
  }

  cooldownWallets.set(sender, Date.now() + 30000); // 30 seconds cooldown

  // Parse burned amount safely
  const rawAmount = transfer.tokenAmount?.uiAmount ?? transfer.tokenAmount?.amount;
  const decimals = transfer.tokenAmount?.decimals ?? 6;
  const burnedAmount = Number(rawAmount) / Math.pow(10, decimals);
  if (isNaN(burnedAmount)) {
    console.log('❌ Burned amount is NaN. Aborting message.');
    return res.sendStatus(200);
  }

  totalBurned += burnedAmount;
  const remainingToBurn = TARGET_BURN - totalBurned;

  // Format with commas
  const format = num => num.toLocaleString('en-US');

  const message = 
`🔥 Another $MARTY burn launched into the abyss of space! 🔥
🚀 Marty’s moon mission is right on schedule.

🔥 ${format(burnedAmount)} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: ${format(TOTAL_SUPPLY)}
 • 🎯 Target Supply: ${format(TARGET_SUPPLY)}
 • 🧨 Target Burn: ${format(TARGET_BURN)}
 • 🔥 Burned So Far: ${format(totalBurned)}
 • 🧮 Still to Burn: ${format(Math.max(remainingToBurn, 0))}

🔗 View on SolScan`;

  try {
    const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;
    const gifUrl = 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true';

    const response = await axios.post(telegramURL, {
      chat_id: TELEGRAM_CHAT_ID,
      animation: gifUrl,
      caption: message,
      parse_mode: 'HTML'
    });

    console.log('✅ Telegram response:', response.data);
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Telegram error:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
