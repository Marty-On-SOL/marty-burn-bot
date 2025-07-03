import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'PASTE_YOUR_REAL_MARTY_MINT_HERE';
const TOTAL_SUPPLY = 1_000_000_000;

app.post('/api/index', async (req, res) => {
  const data = req.body;
  console.log('✅ POST received:', JSON.stringify(data, null, 2));

  const tx = data[0];
  const transfer = tx?.tokenTransfers?.[0];

  if (!transfer) {
    console.log('🧾 Transfer object: undefined');
    console.log('❌ No token transfer data found.');
    return res.sendStatus(200);
  }

  console.log('🧾 Transfer object:', transfer);

  const {
    fromUserAccount,
    toUserAccount,
    mint,
    tokenAmount: {
      uiAmount,
      uiAmountString
    }
  } = transfer;

  if (toUserAccount !== BURN_WALLET || mint !== MARTY_MINT) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const burnedAmount = Number(uiAmount);
  const remainingSupply = TOTAL_SUPPLY - burnedAmount;
  const countdown = remainingSupply.toLocaleString();

  const caption = `🔥🔥🔥 Another Marty burn sent to the abyss of space itself! 🔥🔥🔥

🛰️ Marty’s moon launch is right on schedule!

🔥 ${uiAmountString} $MARTY burned 
🚀 Countdown to launch: ${countdown} tokens left

🔗 View on SolScan`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;

    const response = await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true',
      caption,
      parse_mode: 'HTML'
    });

    console.log('✅ Telegram response:', response.data);
  } catch (error) {
    console.error('❌ Telegram send failed:', error.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
