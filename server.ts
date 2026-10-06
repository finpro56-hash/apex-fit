/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.js';

dotenv.config();

async function startServer() {
  const app = createApp();

  // Vite middleware for local development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Apex Fit server running on http://0.0.0.0:${port}`);
  });
}

startServer();
