import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { followPerson } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { PersonFollowDto } from './dto/person-follow.dto';

@Injectable()
export class PersonsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  /* --------------------------------- Follows -------------------------------- */
  async getFollowStatus(currentUserId: string, personId: number): Promise<PersonFollowDto | null> {
    const followRecord = await this.db.query.followPerson.findFirst({
      where: and(
        eq(followPerson.userId, currentUserId),
        eq(followPerson.personId, personId)
      )
    });

    if (!followRecord) {
      return null;
    }

    return plainToInstance(PersonFollowDto, followRecord, {
      excludeExtraneousValues: true,
    });
  }

  async follow(currentUserId: string, personId: number): Promise<PersonFollowDto> {
    const [newFollow] = await this.db
      .insert(followPerson)
      .values({
        userId: currentUserId,
        personId: personId,
      })
      .onConflictDoNothing()
      .returning();

    return plainToInstance(PersonFollowDto, newFollow, {
      excludeExtraneousValues: true,
    });
  }

  async unfollow(currentUserId: string, personId: number): Promise<PersonFollowDto> {
    const [deletedFollow] = await this.db
      .delete(followPerson)
      .where(
        and(
          eq(followPerson.userId, currentUserId),
          eq(followPerson.personId, personId)
        )
      )
      .returning();

    if (!deletedFollow) {
      throw new NotFoundException('Follow relationship not found');
    }

    return plainToInstance(PersonFollowDto, deletedFollow, {
      excludeExtraneousValues: true,
    });
  }
  /* -------------------------------------------------------------------------- */
}
