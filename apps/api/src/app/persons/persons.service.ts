import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { and, eq, sql } from 'drizzle-orm';
import { followPerson, tmdbPersonView } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { PersonFollowDto } from './dto/person-follow.dto';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { PersonDto } from './dto/persons.dto';

@Injectable()
export class PersonsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    personId,
    currentUser,
    locale,
  }: {
    personId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<PersonDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const [person] = await tx
        .select()
        .from(tmdbPersonView)
        .where(eq(tmdbPersonView.id, personId))
        .limit(1);

      if (!person) {
        throw new NotFoundException(`Person with id ${personId} not found`);
      }

      return person;
    });
  }

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
