import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { and, eq, sql } from 'drizzle-orm';
import { profile, follow } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { WorkerClient } from '@shared/worker';
import { FollowDto } from './dto/user-follow.dto';
import { NotifyClient } from '@shared/notify';

@Injectable()
export class UserFollowService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient, 
  ) {}

  async get({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string,
    targetUserId: string
  }): Promise<FollowDto | null> {
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

  async set({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<FollowDto> {
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
          await this.notify.emit('follow:new', {
            actorId: currentUserId,
            targetUserId: targetUserId,
          });
        } else if (newFollow.status === 'pending') {
          await this.notify.emit('follow:request', {
            actorId: currentUserId,
            targetUserId: targetUserId,
          });
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

  async delete({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<FollowDto> {
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

    return plainToInstance(FollowDto, deletedFollow, {
      excludeExtraneousValues: true,
    });
  }

  async accept({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<FollowDto> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot accept follow request from yourself');
    }
  
    const [updatedFollow] = await this.db
      .update(follow)
      .set({ status: 'accepted' })
      .where(
        and(
          eq(follow.followerId, targetUserId),
          eq(follow.followingId, currentUserId),
          eq(follow.status, 'pending')
        )
      )
      .returning();

    await this.notify.emit('follow:accepted', {
      actorId: currentUserId,
      targetUserId: targetUserId,
    });

    if (!updatedFollow) {
      throw new NotFoundException('Follow request not found');
    }
    return plainToInstance(FollowDto, updatedFollow, {
      excludeExtraneousValues: true,
    });
  }

  async decline({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<FollowDto> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot decline follow request from yourself');
    }
  
    const [updatedFollow] = await this.db
      .delete(follow)
      .where(
        and(
          eq(follow.followerId, targetUserId),
          eq(follow.followingId, currentUserId),
          eq(follow.status, 'pending')
        )
      )
      .returning();

    if (!updatedFollow) {
      throw new NotFoundException('Follow request not found');
    }

    return plainToInstance(FollowDto, updatedFollow, {
      excludeExtraneousValues: true,
    });
  }
}
