import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  NotFoundException, 
  BadRequestException, 
  Inject 
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../modules/drizzle/drizzle.module';
import { tmdbMovie, tmdbTvSeries } from '@libs/db/schemas';
import { MediaType } from '../enums/medias.enum';

@Injectable()
export class MediaExistsGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const { type, media_id } = request.params;

    if (!type || !media_id) {
      throw new BadRequestException('Missing "type" or "media_id" parameters.');
    }

    const mediaIdNum = parseInt(media_id, 10);
    if (isNaN(mediaIdNum)) {
      throw new BadRequestException('"media_id" must be a valid number.');
    }

    if (type === MediaType.MOVIE) {
      const movie = await this.db.query.tmdbMovie.findFirst({
        where: eq(tmdbMovie.id, mediaIdNum),
        columns: { id: true },
      });
      
      if (!movie) {
        throw new NotFoundException(`Movie with ID ${mediaIdNum} not found.`);
      }
    } else if (type === MediaType.TV_SERIES) {
      const tvSeries = await this.db.query.tmdbTvSeries.findFirst({
        where: eq(tmdbTvSeries.id, mediaIdNum),
        columns: { id: true },
      });
      
      if (!tvSeries) {
        throw new NotFoundException(`TV Series with ID ${mediaIdNum} not found.`);
      }
    } else {
      throw new BadRequestException(`Invalid media type: ${type}`);
    }

    return true;
  }
}