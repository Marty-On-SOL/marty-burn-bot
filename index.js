import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const cooldowns = new Map();
const COOLDOWN_MS = 60000;

const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';
const MARTY_DECIMALS = 9;
const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

const BURN_DATA_FILE = path.join(__dirname, 'burn_data.json');

// Utility functions for persistent storage
function getCumulativeBurned() {
  try {
    if (fs.existsSync(BURN_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(BURN_DATA_FILE, 'utf-8'));
      return data.cumulativeBurned || 0;
    }
  } catch (error) {
    console.error('❌ Error reading burn data:', error.message);
  }
  return 0;
}

function saveCumulativeBurned(amount) {
  try {
    const data = {
      cumulativeBurned: amount,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(BURN_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error saving burn data:', error.message);
  }
}

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('✅ POST received:', JSON.stringify(req.body, null, 2));
  const events = req.body;

  if (!Array.isArray(events)) {
    console.warn('⚠️ Events is not an array');
    return res.send('OK');
  }

  for (const event of events) {
    // Clean support for both formats
    if (!event.tokenTransfers || !Array.isArray(event.tokenTransfers)) continue;
    const tokenTransfers = event.tokenTransfers;

    for (const transfer of tokenTransfers) {
      // Validate transfer object
      if (
        !transfer.fromUserAccount ||
        !transfer.toUserAccount ||
        !transfer.mint ||
        transfer.tokenAmount === undefined
      ) {
        console.warn('⚠️ Invalid transfer object:', transfer);
        continue;
      }

      const { fromUserAccount, toUserAccount, tokenAmount, mint } = transfer;

      if (toUserAccount === BURN_WALLET && mint === MARTY_MINT) {
        const sender = fromUserAccount;
        const now = Date.now();

        if (cooldowns.has(sender) && now - cooldowns.get(sender) < COOLDOWN_MS) {
          console.log('⏳ Cooldown active for sender:', sender);
          continue;
        }

        cooldowns.set(sender, now);

        // Parse token amount with proper decimals
        const rawAmount =
          tokenAmount.uiAmount || tokenAmount.amount || tokenAmount.tokenAmount || tokenAmount;
        const amountBurned =
          typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) / Math.pow(10, MARTY_DECIMALS);

        // Get cumulative burn total
        let cumulativeBurned = getCumulativeBurned();
        cumulativeBurned += amountBurned;
        saveCumulativeBurned(cumulativeBurned);

        const stillToBurn = Math.max(0, TARGET_BURN - cumulativeBurned);
        const burnPercentage = ((cumulativeBurned / TARGET_BURN) * 100).toFixed(2);

        // Determine fire emoji count based on amount burned
        let fireCount = 1;
        if (amountBurned >= 1000) fireCount = 5;
        else if (amountBurned >= 500) fireCount = 4;
        else if (amountBurned >= 100) fireCount = 3;
        else if (amountBurned >= 50) fireCount = 2;

        const fireEmoji = '🔥'.repeat(fireCount);

        const message = `${fireEmoji}  Another $MARTY burn sent to the abyss of space!  ${fireEmoji}

🚀 Marty's moon mission is right on schedule.

🔥 ${amountBurned.toLocaleString()} $MARTY burned

🧠 Countdown to Marty's moon launch:
 • 🪐 Total Supply: ${TOTAL_SUPPLY.toLocaleString()}
 • 🎯 Target Supply: ${TARGET_SUPPLY.toLocaleString()}
 • 🧨 Target Burn: ${TARGET_BURN.toLocaleString()}
 • 🔥 Burned So Far: ${cumulativeBurned.toLocaleString()}
 • 📊 Progress: ${burnPercentage}%
 • 🧮 Still to Burn: ${stillToBurn.toLocaleString()}

🔗 View on SolScan`;

        try {
          await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAnimation`,
            {
              chat_id: process.env.TELEGRAM_CHAT_ID,
              animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/public/marty-blastoff.gif?raw=true',
              caption: message,
              parse_mode: 'Markdown',
            }
          );

          console.log('✅ Telegram GIF via URL sent.');
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
  console.log(`📊 Current cumulative burned: ${getCumulativeBurned().toLocaleString()} $MARTY`);
});
