import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIGURATION ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TARGET_BURN_ADDRESS = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT_ADDRESS = 'PASTE_YOUR_REAL_MARTY_MINT_HERE';
const LAUNCH_TARGET = 690420000;

app.use(bodyParser.json());

app.post('/api/index', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));

  const tx = req.body[0];
  const transfer = tx?.tokenTransfers?.[0];
  const signature = tx?.signature || 'Unknown Signature';

  if (!transfer) {
    console.log('❌ No token transfer data found.');
    return res.sendStatus(200);
  }

  console.log('🧾 Transfer object:', transfer);

  const {
    fromUserAccount,
    toUserAccount,
    tokenAmount,
    mint
  } = transfer;

  if (
    toUserAccount !== TARGET_BURN_ADDRESS ||
    mint !== MARTY_MINT_ADDRESS
  ) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const amountBurned = parseFloat(tokenAmount.uiAmount);
  const remainingSupply = Math.max(LAUNCH_TARGET - amountBurned, 0).toLocaleString();

  const txLink = `https://solscan.io/tx/${signature}`;

  const caption = 
`🚀 Another Marty burn sent to the abyss of space itself! 🔥🔥🔥

🛰️ Marty’s moon launch is right on schedule!

🔥 ${amountBurned} $MARTY burned  
🚀 Countdown to launch: ${remainingSupply} tokens left

🔗 [View on SolScan](${txLink})`;

  try {
    const gifUrl = 'https://github.com/Marty-On-SOL/marty-burn-bot/raw/main/marty%20blastoff%201080%20x%201080%20gif.gif';

    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`, {
      chat_id: TELEGRAM_CHAT_ID,
      animation: gifUrl,
      caption,
      parse_mode: 'Markdown'
    });

    console.log('✅ Telegram response:', response.data);
  } catch (err) {
    console.error('❌ Telegram error:', err?.response?.data || err.message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
