import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import { PlaylistCreateDto, PlaylistDto, PlaylistGetDTO, PlaylistUpdateDto } from './dto/playlists.dto';
import { playlist, playlistMember } from '@libs/db/schemas';
import { and, eq, notInArray, or, sql } from 'drizzle-orm';
import { PlaylistMemberListDto, PlaylistMemberUpdateDto } from './dto/playlist-members.dto';
import { plainToInstance } from 'class-transformer';
import { StorageService } from '../../common/modules/storage/storage.service';
import { StorageFolders } from '../../common/modules/storage/storage.constants';
import { canViewPlaylist } from './playlists.permission';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly storageService: StorageService,
  ) {}

  async get({
    playlistId,
    user: currentUser,
  }: {
    playlistId: number;
    user: User | null;
  }): Promise<PlaylistGetDTO> {
    const accessCondition = canViewPlaylist(this.db, currentUser);

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
        ...(currentUser ? {
          members: {
            where: eq(playlistMember.userId, currentUser.id),
            columns: { role: true }, 
          }
        } : {})
      }
    });

    if (!result) {
      throw new NotFoundException('Playlist not found');
    }

    const { user, members, ...playlistData } = result;

    return plainToInstance(PlaylistGetDTO, {
      ...playlistData,
      role: currentUser?.id === playlistData.userId
        ? 'owner'
        : members && members.length > 0
          ? members[0].role
          : null,
      owner: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.image,
        isPremium: user.profile.isPremium,
      }
    });
  }

  async create(currentUser: User, createPlaylistDto: PlaylistCreateDto): Promise<PlaylistDto> {
    const [insertedPlaylist] = await this.db.insert(playlist).values({
      userId: currentUser.id,
      ...createPlaylistDto,
    }).returning();
    return plainToInstance(PlaylistDto, insertedPlaylist);
  }

  async update({
    user,
    playlistId,
    updatePlaylistDto,
  }: {
    user: User;
    playlistId: number;
    updatePlaylistDto: PlaylistUpdateDto;
  }): Promise<PlaylistDto> {
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
      throw new NotFoundException();
    }
    return plainToInstance(PlaylistDto, updatedPlaylist);
  }

  async delete({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistDto> {
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

    if (deletedPlaylist.poster) {
      this.storageService.deleteFile(deletedPlaylist.poster, StorageFolders.PLAYLIST_POSTERS).catch(err => 
        this.logger.error(`Failed to delete poster: ${deletedPlaylist.poster}`, err)
      );
    }

    return plainToInstance(PlaylistDto, deletedPlaylist);
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
  
    return plainToInstance(PlaylistMemberListDto, {
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
    });
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
        .set({ updatedAt: sql`now()` }) 
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

    return plainToInstance(PlaylistMemberListDto, {
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
    });
  }
}
