import fastify from 'fastify';
import { processMessage } from './script';

const server = fastify();

server.get('/ping', async (request, reply) => {
  return { health: 'true' };
});

server.post('/sms', async (request, reply) => {
  const message = request.body['message'];
  processMessage(message);
  return { ingested: true };
});

export const start = async () => {
  try {
    await server.listen(3000);
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
