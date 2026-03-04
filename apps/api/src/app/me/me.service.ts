import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { eq } from 'drizzle-orm';
import { profile, user } from '@libs/db/schemas';
import { User } from '../auth/auth.service';
import { WorkerClient } from '@shared/worker';
import { UpdateUserDto, UserDto } from '../users/dto/users.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MeService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly workerClient: WorkerClient,
  ) {}

  async get(loggedUser: User): Promise<UserDto> {
    const fullUser = await this.db.query.user.findFirst({
      where: eq(user.id, loggedUser.id),
      with: {
        profile: true,
      }
    });

    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(UserDto, {
      id: fullUser.id,
      updatedAt: fullUser.updatedAt,
      createdAt: fullUser.createdAt,
      email: fullUser.email,
      emailVerified: fullUser.emailVerified,
      name: fullUser.name,
      username: fullUser.username,
      usernameUpdatedAt: fullUser.usernameUpdatedAt,
      bio: fullUser.profile.bio,
      language: fullUser.language,
      avatar: fullUser.image,
      backgroundImage: fullUser.profile.backgroundImage,
      isPremium: fullUser.profile.isPremium,
      isPrivate: fullUser.profile.isPrivate,
      followersCount: fullUser.profile.followersCount,
      followingCount: fullUser.profile.followingCount,
    });
  }

  async update(
    loggedUser: User,
    dto: UpdateUserDto,
  ): Promise<UserDto> {
    const userUpdates: Partial<typeof user.$inferSelect> = {};
    let shouldSyncSearch = false;

    if (dto.name !== undefined) {
      userUpdates.name = dto.name;
      shouldSyncSearch = true;
    }

    if (dto.language !== undefined) {
      userUpdates.language = dto.language;
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
      userUpdates.usernameUpdatedAt = new Date().toISOString();
      shouldSyncSearch = true;
    }

    const profileUpdates: Partial<typeof profile.$inferSelect> = {};
    if (dto.bio !== undefined) profileUpdates.bio = dto.bio;
    if (dto.isPrivate !== undefined) profileUpdates.isPrivate = dto.isPrivate;

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

    return this.get(loggedUser);
  }
}
