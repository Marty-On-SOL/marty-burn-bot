import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable static file serving from /public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, 'public')));

const cooldowns = new Map();
const COOLDOWN_MS = 60000;

const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));
  const events = req.body;

  for (const event of events) {
    if (event.type !== 'TRANSFER' || !event.tokenTransfers) continue;

    for (const transfer of event.tokenTransfers) {
      const { fromUserAccount, toUserAccount, tokenAmount, mint } = transfer;

      if (
        toUserAccount === BURN_WALLET &&
        mint === MARTY_MINT &&
        tokenAmount &&
        tokenAmount.uiAmount
      ) {
        const sender = fromUserAccount;
        const now = Date.now();

        if (cooldowns.has(sender) && now - cooldowns.get(sender) < COOLDOWN_MS) {
          console.log('⏳ Cooldown active for sender:', sender);
          continue;
        }

        cooldowns.set(sender, now);

        const amountBurned = tokenAmount.uiAmount;
        const burnedSoFar = amountBurned;
        const stillToBurn = TARGET_BURN - burnedSoFar;

        let fireCount = 1;
        if (amountBurned >= 1000) fireCount = 5;
        else if (amountBurned >= 500) fireCount = 4;
        else if (amountBurned >= 100) fireCount = 3;
        else if (amountBurned >= 50) fireCount = 2;

        const fireEmoji = '🔥'.repeat(fireCount);

        const message = `${fireEmoji}  Another $MARTY burn sent to the abyss of space!  ${fireEmoji}

🚀 Marty’s moon mission is right on schedule.

🔥 ${amountBurned.toLocaleString()} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: ${TOTAL_SUPPLY.toLocaleString()}
 • 🎯 Target Supply: ${TARGET_SUPPLY.toLocaleString()}
 • 🧨 Target Burn: ${TARGET_BURN.toLocaleString()}
 • 🔥 Burned So Far: ${amountBurned.toLocaleString()}
 • 🧮 Still to Burn: ${stillToBurn.toLocaleString()}

🔗 View on SolScan`;

        try {
          // Send local GIF
          const gifPath = path.join(__dirname, 'public', 'marty-blastoff.gif');
          const gifStream = fs.createReadStream(gifPath);

          const formData = new FormData();
          formData.append('chat_id', process.env.TELEGRAM_CHAT_ID);
          formData.append('animation', gifStream, 'marty-blastoff.gif');
          formData.append('caption', `🔥 ${amountBurned.toLocaleString()} $MARTY just burned!`);
          formData.append('parse_mode', 'Markdown');

          await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`, formData, {
            headers: formData.getHeaders()
          });

          // Send the follow-up message
          await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
          });

          console.log('✅ GIF and message sent.');
        } catch (error) {
          console.error('❌ Telegram error:', error.response?.data || error.message);
        }
      }
    }
  }

  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
