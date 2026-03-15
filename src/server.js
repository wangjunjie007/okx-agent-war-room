import { createApp } from './app.js';

const app = createApp();
const port = process.env.PORT || 8848;

app.listen(port, () => {
  console.log(`okx-agent-war-room listening on http://127.0.0.1:${port}`);
});
