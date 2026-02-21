import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { profile, user, follow } from '@libs/db/schemas';
import { UserDto, UpdateUserDto, ProfileDto } from './dto/users.dto';
import { User } from '../auth/auth.service';
import { FollowDto } from './dto/user-follow.dto';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { USER_RULES } from '../../config/validation-rules';
import { WorkerClient } from '@shared/worker';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly workerClient: WorkerClient,
  ) {}

  async getMe(loggedUser: User): Promise<UserDto> {
    const fullUser = await this.db.query.user.findFirst({
      where: eq(user.id, loggedUser.id),
      with: {
        profile: true,
      }
    });

    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    return {
      id: fullUser.id,
      updatedAt: fullUser.updatedAt,
      createdAt: fullUser.createdAt,
      email: fullUser.email,
      emailVerified: fullUser.emailVerified,
      name: fullUser.name,
      username: fullUser.username,
      usernameUpdatedAt: fullUser.usernameUpdatedAt,
      bio: fullUser.profile.bio,
      language: fullUser.profile.language,
      avatar: fullUser.image,
      backgroundImage: fullUser.profile.backgroundImage,
      isPremium: fullUser.profile.isPremium,
      isPrivate: fullUser.profile.isPrivate,
      followersCount: fullUser.profile.followersCount,
      followingCount: fullUser.profile.followingCount,
    }
  }

  async updateMe(
    loggedUser: User,
    dto: UpdateUserDto,
    avatar?: File, 
  ): Promise<UserDto> {
    const userUpdates: Partial<typeof user.$inferSelect> = {};
    let shouldSyncSearch = false;

    if (dto.name !== undefined) {
      userUpdates.name = dto.name;
      shouldSyncSearch = true;
    }

    if (dto.username !== undefined && dto.username !== loggedUser.username) {
      if (loggedUser.usernameUpdatedAt) {
        const now = new Date();
        const diff = now.getTime() - new Date(loggedUser.usernameUpdatedAt).getTime();
        const diffDays = diff / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          throw new BadRequestException(`Username can only be changed once every 30 days. Please try again in ${Math.ceil(30 - diffDays)} days.`);
        }
      }
      userUpdates.username = dto.username;
      userUpdates.usernameUpdatedAt = new Date();
      shouldSyncSearch = true;
    }

    const profileUpdates: Partial<typeof profile.$inferSelect> = {};
    if (dto.bio !== undefined) profileUpdates.bio = dto.bio;
    if (dto.isPrivate !== undefined) profileUpdates.isPrivate = dto.isPrivate;
    if (dto.language !== undefined) profileUpdates.language = dto.language;

    if (avatar) {
      // TODO: upload avatar
    }

    await this.db.transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.update(user)
          .set(userUpdates)
          .where(eq(user.id, loggedUser.id));
      }
      if (Object.keys(profileUpdates).length > 0) {
        await tx.update(profile)
          .set(profileUpdates)
          .where(eq(profile.id, loggedUser.id));
      }
    });

    if (shouldSyncSearch) {
      await this.workerClient.emit('search:sync-user', { userId: loggedUser.id });
    }

    return this.getMe(loggedUser);
  }

  async getProfile(identifier: string, currentUser: User | null): Promise<ProfileDto> {
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
        language: profile.language,
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

  /* --------------------------------- Follows -------------------------------- */

  async getFollowStatus(currentUserId: string, targetUserId: string): Promise<FollowDto | null> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    const followRecord = await this.db.query.follow.findFirst({
      where: and(
        eq(follow.followerId, currentUserId),
        eq(follow.followingId, targetUserId)
      )
    });

    if (!followRecord) {
      return null;
    }

    return plainToInstance(FollowDto, followRecord, {
      excludeExtraneousValues: true,
    });
  }

  async followUser(currentUserId: string, targetUserId: string): Promise<FollowDto> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    return this.db.transaction(async (tx) => {
      const [newFollow] = await tx
        .insert(follow)
        .select(
          tx
            .select({
              followerId: sql`${currentUserId}::uuid`.as('follower_id'),
              followingId: profile.id,
              status: sql`
                CASE 
                  WHEN ${profile.isPrivate} THEN 'pending' 
                  ELSE 'accepted' 
                END::follow_status_enum
              `.as('status'),
              createdAt: sql`now()`.as('created_at'), 
            })
            .from(profile)
            .where(eq(profile.id, targetUserId))
        )
        .onConflictDoNothing()
        .returning();
      if (newFollow) {
        if (newFollow.status === 'accepted') {
          // TODO:
          // - Update followers_count and following_count in profile table
          // - Send notification to the followed user
        }
        return plainToInstance(FollowDto, newFollow, {
          excludeExtraneousValues: true,
        });
      } else {
        const existingFollow = await tx.query.follow.findFirst({
          where: and(
            eq(follow.followerId, currentUserId),
            eq(follow.followingId, targetUserId)
          )
        });
        if (!existingFollow) {
          throw new NotFoundException('User to follow not found');
        }
        return plainToInstance(FollowDto, existingFollow, {
          excludeExtraneousValues: true,
        });
      }
    });
  }

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<FollowDto> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }
  
    const [deletedFollow] = await this.db
      .delete(follow)
      .where(
        and(
          eq(follow.followerId, currentUserId),
          eq(follow.followingId, targetUserId)
        )
      )
      .returning();

    if (!deletedFollow) {
      throw new NotFoundException('Follow relationship not found');
    }

    // TODO:
    // - Update followers_count and following_count in profile table

    return plainToInstance(FollowDto, deletedFollow, {
      excludeExtraneousValues: true,
    });
  }
  /* -------------------------------------------------------------------------- */
}
