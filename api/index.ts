/**
 * Vercel serverless entry. One function serves every /api/* request (see the rewrites in vercel.json); the static client
 * is served from client/dist. The Express app is created in server/src/app.ts (no listen) and shared with the local/docker server.
 */
import { app } from '../server/src/app.js';

export default app;
