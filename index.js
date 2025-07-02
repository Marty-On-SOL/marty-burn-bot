const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post("/api/index.js", (req, res) => {
  console.log("🔔 Webhook received");

  const { type, transaction, signature } = req.body;

  if (
    type === "TRANSFER" &&
    transaction?.events?.tokenTransfers?.[0]?.mint === process.env.MINT_ADDRESS
  ) {
    const amount = transaction.events.tokenTransfers[0].tokenAmount.uiAmountString;
    console.log(`🔥 ${amount} tokens burned! Signature: ${signature}`);
  }

  res.status(200).json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

