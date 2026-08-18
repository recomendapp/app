import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, ServerOptions } from 'socket.io';
import { env } from '../../env';

/**
 * Without this, Socket.IO falls back to its default in-memory adapter — rooms only exist
 * within a single process. With multiple API replicas behind a Service that load-balances
 * connections across pods, a broadcast triggered by a request handled on pod A never reaches
 * a socket connected to pod B, so realtime events are dropped intermittently depending on
 * which pod each client's websocket landed on. This adapter publishes room events through
 * Redis pub/sub so every pod's Socket.IO server sees them.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisOptions = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
    };

    const pubClient = new Redis(redisOptions);
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => this.logger.error('Redis pub client error', err));
    subClient.on('error', (err) => this.logger.error('Redis sub client error', err));

    this.pubClient = pubClient;
    this.subClient = subClient;
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Socket.IO Redis adapter connected — realtime events now fan out across pods');
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    } else {
      this.logger.warn(
        'Redis adapter was not connected before server creation — falling back to in-memory adapter',
      );
    }
    return server;
  }

  async close(server: Server): Promise<void> {
    await super.close(server);

    await Promise.all(
      [this.pubClient, this.subClient].map(async (client) => {
        if (!client) return;
        try {
          await client.quit();
        } catch (err) {
          this.logger.warn('Error while closing a Redis pub/sub client', err);
        }
      }),
    );
  }
}
