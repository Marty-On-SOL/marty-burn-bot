import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'PASTE_YOUR_REAL_MARTY_MINT_HERE';

const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

app.use(express.json());

app.post('/api/index', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));

  const data = req.body[0];
  const signature = data.signature || 'N/A';

  const transfer = data.tokenTransfers?.find(t =>
    t.toUserAccount === BURN_WALLET && t.mint === MARTY_MINT
  );

  if (!transfer) {
    console.log('❌ Not a valid $MARTY burn to burn wallet.');
    return res.sendStatus(200);
  }

  const tokenAmount = transfer.tokenAmount.uiAmount;

  // Read total burned
  let totalBurnedSoFar = 0;
  try {
    totalBurnedSoFar = parseFloat(fs.readFileSync('burned.txt', 'utf8')) || 0;
  } catch (e) {
    totalBurnedSoFar = 0;
  }

  totalBurnedSoFar += tokenAmount;
  fs.writeFileSync('burned.txt', totalBurnedSoFar.toString());

  const formattedBurned = totalBurnedSoFar.toLocaleString();
  const tokensLeft = Math.max(0, TARGET_BURN - totalBurnedSoFar);
  const formattedLeft = tokensLeft.toLocaleString();

  const caption = `🔥 Another Marty burn sent to the abyss of space itself! 🔥\n\n` +
                  `🛰️ Marty’s moon launch is right on schedule!\n\n` +
                  `🔥 ${tokenAmount.toLocaleString()} $MARTY burned\n` +
                  `🔥 Total burned: ${formattedBurned}\n` +
                  `🚀 Tokens left to burn before launch: ${formattedLeft}\n\n` +
                  `🔗 View on SolScan: https://solscan.io/tx/${signature}`;

  try {
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`, {
      chat_id: TELEGRAM_CHAT_ID,
      animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true',
      caption: caption,
      parse_mode: 'HTML'
    });

    console.log('✅ Telegram response:', JSON.stringify(response.data, null, 2));
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error sending to Telegram:', error.message);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`🚀 Marty Burn Bot listening on port ${port}`);
});
