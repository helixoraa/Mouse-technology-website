import { env } from './env.js';
import { prisma } from './db.js';
import { app } from './app.js';

/** Local / Docker entry. On Vercel the app is exported by api/index.ts instead (no listen). */
const server = app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT} (CORS: ${env.CLIENT_URL})`));

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
