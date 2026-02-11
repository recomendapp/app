import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { AuthenticatedRequest } from '../../auth/types/fastify';
import { playlist } from '@libs/db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class PlaylistOwnerGuard implements CanActivate {
  constructor(@Inject(DRIZZLE_SERVICE) private db: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & { params: { playlistId: string } }>();
    const user = request.user;
    const playlistId = parseInt(request.params.playlistId);

    if (!user || !playlistId) return false;

    const found = await this.db.query.playlist.findFirst({
      where: eq(playlist.id, playlistId),
      columns: {
        userId: true,
      }
    });

    if (!found) throw new NotFoundException();
    
    return found.userId === user.id;
  }
}