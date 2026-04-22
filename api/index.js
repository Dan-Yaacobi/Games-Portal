export default function handler(req, res) {
  res.status(200).json({ ok: true });
}
// import serverless from 'serverless-http';
// import { createApp } from '../backend/src/app.js';

// const app = createApp();

// export default serverless(app);