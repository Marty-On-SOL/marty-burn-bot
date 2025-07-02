const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/index', (req, res) => {
  console.log('Received POST:', req.body);
  res.status(200).send('POST received successfully.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
