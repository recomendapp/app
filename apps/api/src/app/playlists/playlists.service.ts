import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { User } from '../auth/auth.service';
import { PlaylistCreateDto, PlaylistDTO, PlaylistGetDTO, PlaylistUpdateDto } from './dto/playlists.dto';
import { follow, playlist, playlistMember } from '@libs/db/schemas';
import { and, eq, exists, notInArray, or, sql, SQL } from 'drizzle-orm';
import { PlaylistMemberListDto, PlaylistMemberUpdateDto } from './dto/playlists-members.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    playlistId,
    user: currentUser,
  }: {
    playlistId: number;
    user: User | null;
  }): Promise<PlaylistGetDTO> {
    const isMemberQuery = currentUser 
      ? this.db
          .select()
          .from(playlistMember)
          .where(and(
            eq(playlistMember.playlistId, playlist.id),
            eq(playlistMember.userId, currentUser.id)
          ))
      : null;

    const isFollowerQuery = currentUser
      ? this.db
          .select()
          .from(follow)
          .where(and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, playlist.userId),
            eq(follow.status, 'accepted')
          ))
      : null;

    let accessCondition: SQL;

    if (!currentUser) {
      accessCondition = eq(playlist.visibility, 'public');
    } else {
      accessCondition = or(
        eq(playlist.visibility, 'public'),
        eq(playlist.userId, currentUser.id),
        exists(isMemberQuery),
        and(
          eq(playlist.visibility, 'followers'),
          exists(isFollowerQuery)
        )
      );
    }

    const result = await this.db.query.playlist.findFirst({
      where: and(
        eq(playlist.id, playlistId),
        accessCondition
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
          with: {
            profile: { columns: { isPremium: true } }
          } 
        },
      }
    });

    if (!result) {
      throw new NotFoundException('Playlist not found');
    }

    const { user, ...playlistData } = result;

    return {
      ...playlistData,
      owner: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.image,
        isPremium: user.profile.isPremium,
      }
    };
  }

  async create(user: User, createPlaylistDto: PlaylistCreateDto): Promise<PlaylistDTO> {
    const [newPlaylist] = await this.db.insert(playlist).values({
      userId: user.id,
      ...createPlaylistDto,
    }).returning();
    return newPlaylist;
  }

  async update({
    user,
    playlistId,
    updatePlaylistDto,
  }: {
    user: User;
    playlistId: number;
    updatePlaylistDto: PlaylistUpdateDto;
  }): Promise<PlaylistDTO> {
    const [updatedPlaylist] = await this.db.update(playlist)
      .set(updatePlaylistDto)
      .where(
        and(
          eq(playlist.id, playlistId),
          eq(playlist.userId, user.id),
        )
      )
      .returning();
    if (!updatedPlaylist) {
      throw new NotFoundException()
    }
    return updatedPlaylist;
  }

  async delete({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistDTO> {
    const [deletedPlaylist] = await this.db.delete(playlist)
      .where(
        and(
          eq(playlist.id, playlistId),
          eq(playlist.userId, user.id),
        )
      )
      .returning();

    if (!deletedPlaylist) {
      throw new NotFoundException();
    }
    return deletedPlaylist;
  }

  // Members
  async getMembers({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistMemberListDto> {
    const [accessCheck] = await this.db
      .select({ id: playlist.id })
      .from(playlist)
      .leftJoin(playlistMember, and(
        eq(playlistMember.playlistId, playlist.id),
        eq(playlistMember.userId, user.id)
      ))
      .where(and(
        eq(playlist.id, playlistId),
        or(
          eq(playlist.userId, user.id),
          eq(playlistMember.role, 'editor')
        )
      ))
      .limit(1);

    if (!accessCheck) {
      throw new NotFoundException('Playlist not found or access denied');
    }

    const members = await this.db.query.playlistMember.findMany({
      where: eq(playlistMember.playlistId, playlistId),
      with: {
        user: {
          columns: { id: true, name: true, username: true, image: true },
          with: { profile: { columns: { isPremium: true } } }
        }
      }
    });
  
    return {
      members: members.map(({ user, ...member }) => ({
        ...member,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: user.profile?.isPremium ?? false,
        }
      }))
    };
  }

  async updateMembers({
    user,
    playlistId,
    updateMembersDto,
  }: {
    user: User;
    playlistId: number;
    updateMembersDto: PlaylistMemberUpdateDto;
  }): Promise<PlaylistMemberListDto> {
    const membersToUpsert = updateMembersDto.members.map((member) => ({
      playlistId, 
      userId: member.userId,
      role: member.role,
    }));
    const userIdsToKeep = membersToUpsert.map((m) => m.userId);

    const updatedMembers = await this.db.transaction(async (tx) => {
      const [ownershipCheck] = await tx
        .update(playlist)
        .set({ updatedAt: new Date() }) 
        .where(and(
          eq(playlist.id, playlistId),
          eq(playlist.userId, user.id)
        ))
        .returning({ id: playlist.id });

      if (!ownershipCheck) {
        throw new NotFoundException('Playlist not found or access denied');
      }

      if (userIdsToKeep.length > 0) {
        await tx.delete(playlistMember)
          .where(and(
              eq(playlistMember.playlistId, playlistId),
              notInArray(playlistMember.userId, userIdsToKeep)
            ));
      } else {
        await tx.delete(playlistMember).where(eq(playlistMember.playlistId, playlistId));
      }

      if (membersToUpsert.length > 0) {
        await tx.insert(playlistMember)
          .values(membersToUpsert)
          .onConflictDoUpdate({
            target: [playlistMember.playlistId, playlistMember.userId],
            set: { role: sql`excluded.role` },
          });
      }

      return tx.query.playlistMember.findMany({
        where: eq(playlistMember.playlistId, playlistId),
        with: {
          user: {
            columns: { id: true, name: true, username: true, image: true },
            with: { profile: { columns: { isPremium: true } } }
          }
        }
      });
    });

    return {
      members: updatedMembers.map(({ user, ...member }) => ({
        ...member,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: user.profile?.isPremium ?? false,
        }
      })),
    };
  }
}
