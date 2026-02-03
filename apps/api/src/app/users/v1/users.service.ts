import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '@libs/core';
import { User } from 'better-auth/types';
import { eq } from 'drizzle-orm';
import { user } from '@libs/core/schemas';
import { UserMeDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async getMe(loggedUser: User): Promise<UserMeDto> {
    const fullUser = await this.db.query.user.findFirst({
      where: eq(user.id, loggedUser.id),
      with: {
        profile: true,
      }
    });

    return {
      id: fullUser.id,
      updatedAt: fullUser.updatedAt,
      createdAt: fullUser.createdAt,
      email: fullUser.email,
      emailVerified: fullUser.emailVerified,
      name: fullUser.name,
      username: fullUser.username,
      usernameUpdatedAt: fullUser.usernameUpdatedAt,
      displayUsername: fullUser.displayUsername,
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
}
