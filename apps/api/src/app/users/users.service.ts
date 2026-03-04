import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { eq, sql, SQL } from 'drizzle-orm';
import { profile, user, follow } from '@libs/db/schemas';
import { ProfileDto } from './dto/users.dto';
import { User } from '../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { USER_RULES } from '../../config/validation-rules';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get(identifier: string, currentUser: User | null): Promise<ProfileDto> {
    let isUsernameSearch = false;
    let searchValue = identifier;

    if (identifier.startsWith('@')) {
      isUsernameSearch = true;
      searchValue = identifier.substring(1);
      if (!USER_RULES.USERNAME.REGEX.test(searchValue)) {
        throw new BadRequestException('Invalid username format.');
      }
    } else {
      if (!isUUID(identifier, '7')) { 
        throw new BadRequestException('Invalid User ID format. Use UUID or @username.');
      }
    }
    const whereClause = isUsernameSearch
      ? eq(user.username, searchValue.toLowerCase())
      : eq(user.id, searchValue);

    let isVisibleLogic: SQL;

    const isOwner = currentUser && (
      (isUsernameSearch && currentUser.username?.toLowerCase() === searchValue.toLowerCase()) ||
      (!isUsernameSearch && currentUser.id === searchValue)
    );

    if (isOwner) {
      isVisibleLogic = sql<boolean>`true`;
    } else if (!currentUser) {
      isVisibleLogic = sql<boolean>`NOT ${profile.isPrivate}`;
    } else {
      isVisibleLogic = sql<boolean>`
        (
          NOT ${profile.isPrivate} 
          OR EXISTS (
            SELECT 1 FROM ${follow} 
            WHERE ${follow.followerId} = ${currentUser.id} 
            AND ${follow.followingId} = ${user.id} 
            AND ${follow.status} = 'accepted'
          )
        )
      `;
    }

    const [result] = await this.db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.image,
        createdAt: user.createdAt,
        bio: profile.bio,
        backgroundImage: profile.backgroundImage,
        language: user.language,
        isPremium: profile.isPremium,
        isPrivate: profile.isPrivate,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        isVisible: isVisibleLogic.as('is_visible'),
      })
      .from(user)
      .leftJoin(profile, eq(profile.id, user.id))
      .where(whereClause)
      .limit(1);

    if (!result) {
      throw new NotFoundException('User profile not found');
    }

    return plainToInstance(ProfileDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
