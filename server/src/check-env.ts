// Run by the container entrypoint before migrating/seeding so unsafe secrets never reach the database.
import './env.js';
console.log('Environment OK');
