import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { fromNodeHeaders } from 'better-auth/node';
import { REALTIME_NAMESPACE, getUserRoomName } from '@libs/realtime';
import { AUTH_SERVICE, AuthService } from '../auth/auth.service';
import { AuthenticatedSocket } from '../auth/types/fastify';

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(@Inject(AUTH_SERVICE) private readonly auth: AuthService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const headers = fromNodeHeaders(client.handshake.headers);
      const session = await this.auth.api.getSession({ headers });

      if (!session) {
        this.logger.warn(`Rejecting unauthenticated connection: ${client.id}`);
        client.disconnect(true);
        return;
      }

      client.session = session.session;
      client.user = session.user;
      await client.join(getUserRoomName(session.user.id));
      this.logger.log(`Client connected: ${client.id} (user ${session.user.id})`);
    } catch (err) {
      this.logger.warn(`Rejecting connection ${client.id} after auth error: ${err}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(getUserRoomName(userId)).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    if (userIds.length === 0) return;
    this.server.to(userIds.map(getUserRoomName)).emit(event, payload);
  }
}
