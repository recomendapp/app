import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { explore } from '@libs/db/schemas';
import { eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { ExploreDto } from './dto/explore.dto';

const IDENTIFIER_ID_REGEX = /^\d+$/;

@Injectable()
export class ExploreService {
  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

  private getIdentifierWhereClause(identifier: string) {
    return IDENTIFIER_ID_REGEX.test(identifier)
      ? eq(explore.id, Number(identifier))
      : eq(explore.slug, identifier);
  }

  async get(identifier: string): Promise<ExploreDto> {
    const [result] = await this.db
      .select()
      .from(explore)
      .where(this.getIdentifierWhereClause(identifier))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Explore not found');
    }

    return plainToInstance(ExploreDto, result, { excludeExtraneousValues: true });
  }

  /** Resolves a slug or numeric id to the explore's numeric id, for use by sub-resources. */
  async resolveId(identifier: string): Promise<number> {
    const [result] = await this.db
      .select({ id: explore.id })
      .from(explore)
      .where(this.getIdentifierWhereClause(identifier))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Explore not found');
    }

    return result.id;
  }
}
