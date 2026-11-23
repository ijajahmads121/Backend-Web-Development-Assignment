require('dotenv').config();
const createApp = require('./app');

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  process.stdout.write(`Authentication API listening on port ${port}\n`);
});
