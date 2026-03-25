import { buildApp } from './karaoke-server.js';

const PORT = Number(process.env.KARAOKE_SERVER_PORT) || 8787;

async function main() {
  const fastify = await buildApp();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
