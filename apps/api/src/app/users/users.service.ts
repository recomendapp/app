import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '@libs/core';
import { and, asc, desc, eq, exists, or, sql, SQL } from 'drizzle-orm';
import { playlist, profile, user, follow, playlistMember } from '@libs/core/schemas';
import { UserDTO, UpdateUserDto } from './dto/users.dto';
import { User } from '../auth/auth.service';
import { GetUserPlaylistsQueryDto } from './dto/get-user-playlists.dto';
import { ListPlaylistsDto } from '../playlists/dto/playlists.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async getMe(loggedUser: User): Promise<UserDTO> {
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
  ): Promise<UserDTO> {
    const userUpdates: Partial<typeof user.$inferSelect> = {};
    if (dto.name !== undefined) userUpdates.name = dto.name;
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
    }

    const profileUpdates: Partial<typeof profile.$inferSelect> = {};
    if (dto.bio !== undefined) profileUpdates.bio = dto.bio;
    if (dto.isPrivate !== undefined) profileUpdates.isPrivate = dto.isPrivate;
    if (dto.language !== undefined) profileUpdates.language = dto.language;

    if (avatar) {
      // TODO:
      // upload avatar and get URL (implementation depends on your storage solution)
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

    return this.getMe(loggedUser);
  }

  async getPlaylists(targetUserId: string, query: GetUserPlaylistsQueryDto, currentUser: User | null): Promise<ListPlaylistsDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const direction = sort_order === 'asc' ? asc : desc;
    const orderBy = (() => {
      switch (sort_by) {
        case 'likes_count':
          return direction(playlist.likesCount);
        case 'updated_at':
          return direction(playlist.updatedAt);
        case 'created_at':
        default:
          return direction(playlist.createdAt);
      }
    })();
    const offset = (page - 1) * per_page;

    let whereClause: SQL;

    if (currentUser?.id === targetUserId) { // Owner can see all their playlists
      whereClause = eq(playlist.userId, targetUserId);
    } else if (!currentUser) { // Not logged in, only public playlists
      whereClause = and(
        eq(playlist.userId, targetUserId),
        eq(playlist.visibility, 'public'),
      );
    } else { // Logged in as another user
      const isFollowingSubquery = this.db
        .select({ is_following: sql<boolean>`true` })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, targetUserId),
            eq(follow.status, 'accepted')
          )
        )
        .limit(1);

      whereClause = and(
        eq(playlist.userId, targetUserId),
        or(
          eq(playlist.visibility, 'public'),
          and(
            eq(playlist.visibility, 'followers'),
            exists(isFollowingSubquery)
          ),
          exists(
            this.db.select().from(playlistMember).where(
              and(
                eq(playlistMember.playlistId, playlist.id),
                eq(playlistMember.userId, currentUser.id)
              )
            )
          )
        )
      )
    }

    const [playlists, totalCount] = await Promise.all([
      this.db.query.playlist.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset,
      }),
      this.db.$count(playlist, whereClause),
    ]);

    const totalPages = Math.ceil(totalCount / per_page);

    return {
      data: playlists,
      meta: {
        total_results: totalCount,
        total_pages: totalPages,
        current_page: page,
        per_page,
      },
    };
  }
}
