import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { 
  PLAYLISTS_NAMESPACE,
  PlaylistClientEvents,
  PlaylistServerEvents,
  getPlaylistRoomName,
  PlaylistClientToServerEvents, 
  PlaylistServerToClientEvents,
  IPlaylistItemSignal,
} from '@libs/realtime';

import { AuthGuard } from '../auth/guards/auth.guard'; 
import { PlaylistAuthenticatedSocket, PlaylistRolesGuard } from './guards/playlist-roles.guard';
import { RequirePlaylistRoles } from './decorators/playlist-roles.decorator';


type TypedServer = Server<PlaylistClientToServerEvents, PlaylistServerToClientEvents>;
type TypedSocket = Socket<PlaylistClientToServerEvents, PlaylistServerToClientEvents> & PlaylistAuthenticatedSocket;

@WebSocketGateway({
  namespace: PLAYLISTS_NAMESPACE,
  cors: { origin: '*' },
})
export class PlaylistsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: TypedServer;

  private readonly logger = new Logger(PlaylistsGateway.name);

  handleConnection(client: TypedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: TypedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin', 'editor')
  @SubscribeMessage(PlaylistClientEvents.SUBSCRIBE)
  async handleSubscribe(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: Parameters<PlaylistClientToServerEvents[typeof PlaylistClientEvents.SUBSCRIBE]>[0],
  ) {
    const roomName = getPlaylistRoomName(data.playlistId);
    await client.join(roomName);
    return { event: 'subscribed', data: { playlistId: data.playlistId } };
  }

  @SubscribeMessage(PlaylistClientEvents.UNSUBSCRIBE)
  async handleUnsubscribe(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: Parameters<PlaylistClientToServerEvents[typeof PlaylistClientEvents.UNSUBSCRIBE]>[0],
  ) {
    await client.leave(getPlaylistRoomName(data.playlistId));
  }

  // --- Broadcasts ---
  broadcastItemAdded(playlistId: number, items: IPlaylistItemSignal[]) {
    this.server.to(getPlaylistRoomName(playlistId)).emit(PlaylistServerEvents.ITEM_ADDED, items);
  }

  broadcastItemUpdated(playlistId: number, item: Pick<IPlaylistItemSignal, 'id' | 'rank' | 'comment'>) {
    this.server.to(getPlaylistRoomName(playlistId)).emit(PlaylistServerEvents.ITEM_UPDATED, item);
  }

  broadcastItemDeleted(playlistId: number, itemIds: number[]) {
    this.server.to(getPlaylistRoomName(playlistId)).emit(PlaylistServerEvents.ITEM_DELETED, itemIds);
  }
}