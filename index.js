import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = '7903162757:AAHo897_j18ZR-f8GLFQU1cJVzwbAIxLmqQ';
const TELEGRAM_CHAT_ID = '-1002830823864';

const BURN_WALLET = 'martyburn9999999999999999999999999999999999';
const MARTY_MINT = 'DMNHzC6fprxUcAKM8rEDqVPtTJPYMML3ysPw9yLmpump';

const TOTAL_SUPPLY = 1_000_000_000;
const TARGET_SUPPLY = 690_420_000;
const TARGET_BURN = TOTAL_SUPPLY - TARGET_SUPPLY;

let totalBurned = 0;
const cooldowns = new Set();

app.post('/webhook', async (req, res) => {
  const payload = req.body;
  console.log('✅ POST received:', JSON.stringify(payload, null, 2));

  for (const tx of payload) {
    const signature = tx.signature || 'N/A';

    if (!tx.tokenTransfers || !Array.isArray(tx.tokenTransfers)) continue;

    for (const transfer of tx.tokenTransfers) {
      if (
        transfer.toUserAccount !== BURN_WALLET ||
        transfer.mint !== MARTY_MINT
      ) {
        console.log('❌ Not a valid $MARTY burn to burn wallet.');
        continue;
      }

      let amount = 0;
      let decimals = 0;
      let uiAmount = 0;

      if (typeof transfer.tokenAmount === 'object') {
        amount = parseInt(transfer.tokenAmount.amount || 0);
        decimals = parseInt(transfer.tokenAmount.decimals || 0);
        uiAmount = amount / Math.pow(10, decimals);
      } else if (typeof transfer.tokenAmount === 'number') {
        uiAmount = transfer.tokenAmount;
      }

      if (isNaN(uiAmount) || uiAmount <= 0) {
        console.log('❌ Burned amount is NaN. Aborting message.');
        continue;
      }

      const sender = transfer.fromUserAccount;

      if (cooldowns.has(sender)) {
        console.log(`⏳ Cooldown active for ${sender}. Skipping.`);
        continue;
      }

      totalBurned += uiAmount;
      const stillToBurn = TARGET_BURN - totalBurned;

      const message = `
🔥 Another $MARTY burn launched into the abyss of space! 🔥
🚀 Marty’s moon mission is right on schedule.

🔥 ${uiAmount.toLocaleString()} $MARTY burned

🧠 Countdown to Marty’s moon launch:
 • 🪐 Total Supply: 1,000,000,000
 • 🎯 Target Supply: 690,420,000
 • 🧨 Target Burn: 309,580,000
 • 🔥 Burned So Far: ${totalBurned.toLocaleString()}
 • 🧮 Still to Burn: ${Math.max(stillToBurn, 0).toLocaleString()}

🔗 View on SolScan: https://solscan.io/tx/${signature}
`;

      try {
        const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;
        const formData = {
          chat_id: TELEGRAM_CHAT_ID,
          caption: message,
          animation: 'https://github.com/Marty-On-SOL/marty-burn-bot/blob/main/marty%20blastoff%201080%20x%201080%20gif.gif?raw=true',
          parse_mode: 'Markdown'
        };

        const response = await axios.post(telegramURL, formData);
        console.log('✅ Telegram response:', response.data);

        cooldowns.add(sender);
        setTimeout(() => cooldowns.delete(sender), 10 * 1000);
      } catch (error) {
        console.error('❌ Failed to send Telegram message:', error.message);
      }
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Marty Burn Bot listening on port ${PORT}`);
});
