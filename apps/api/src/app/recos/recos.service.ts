import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { aliasedTable, and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { RecoDto, RecoSendDto, RecoSendResponseDto, RecoType } from './dto/recos.dto';
import { follow, logMovie, logTvSeries, reco, recoTypeEnum } from '@libs/db/schemas';
import { DbTransaction } from '@libs/db';
import { NotifyClient } from '@shared/notify';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RecosService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient,
  ) {}

  async send({
    user,
    type,
    mediaId,
    dto
  }: {
    user: User;
    type: typeof recoTypeEnum.enumValues[number];
    mediaId: number;
    dto: RecoSendDto;
  }): Promise<RecoSendResponseDto> {
    const followAlias = aliasedTable(follow, 'f2');
    
    const baseQuery = this.db
      .select({ id: follow.followingId })
      .from(follow)
      .innerJoin(
        followAlias,
        and(
          eq(follow.followerId, followAlias.followingId),
          eq(follow.followingId, followAlias.followerId)
        )
      );

    const commonWhere = and(
      eq(follow.followerId, user.id),
      inArray(follow.followingId, dto.userIds),
      eq(follow.status, 'accepted'),
      eq(followAlias.status, 'accepted'),
    );

    const validReceiversResult = type === RecoType.MOVIE
      ? await baseQuery
          .leftJoin(logMovie, and(eq(logMovie.userId, follow.followingId), eq(logMovie.movieId, mediaId)))
          .where(and(commonWhere, isNull(logMovie.id)))
      : await baseQuery
          .leftJoin(logTvSeries, and(eq(logTvSeries.userId, follow.followingId), eq(logTvSeries.tvSeriesId, mediaId)))
          .where(and(commonWhere, isNull(logTvSeries.id)));
    const finalReceiverIds = validReceiversResult.map((r) => r.id);

    if (finalReceiverIds.length === 0) {
      throw new BadRequestException('No valid receivers found for the recommendation');
    }

    const targetCols = type === RecoType.MOVIE
      ? [reco.userId, reco.senderId, reco.movieId]
      : [reco.userId, reco.senderId, reco.tvSeriesId];

    const whereSql = type === RecoType.MOVIE
      ? sql`${reco.type} = 'movie'::reco_type`
      : sql`${reco.type} = 'tv_series'::reco_type`;

    const insertValues = finalReceiverIds.map((receiverId) => ({
      userId: receiverId,
      senderId: user.id,
      type: type,
      movieId: type === RecoType.MOVIE ? mediaId : null,
      tvSeriesId: type === RecoType.TV_SERIES ? mediaId : null,
      comment: dto.comment || null,
      status: 'active' as const,
    }));

    const returnedRecos = await this.db
      .insert(reco)
      .values(insertValues)
      .onConflictDoNothing({
        target: targetCols,
        where: whereSql,
      })
      .returning();

    if (returnedRecos.length === 0) {
      return {
        mediaId: mediaId,
        type: type,
        senderId: user.id,
        comment: dto.comment || null,
        sent: [],
        requested: dto.userIds.length,
      }
    };

    await this.notify.emit('reco:received', {
      senderId: user.id,
      receiverIds: returnedRecos.map(r => r.userId),
      mediaId,
      type,
      comment: dto.comment || null,
    });
    
    const item = returnedRecos[0];
    
    return plainToInstance(RecoSendResponseDto, {
      mediaId: item.type === 'movie' ? item.movieId : item.tvSeriesId,
      type: item.type,
      senderId: item.senderId,
      comment: item.comment,
      requested: dto.userIds.length,
      sent: returnedRecos.map(r => r.userId),
    });
  }

  async deleteByMedia({
    user,
    type,
    mediaId,
  }: {
    user: User;
    type: RecoType;
    mediaId: number;
  }): Promise<RecoDto[]> {
    const mediaCondition = type === RecoType.MOVIE 
      ? eq(reco.movieId, mediaId) 
      : eq(reco.tvSeriesId, mediaId);

    const updatedRecos = await this.db
      .update(reco)
      .set({ status: 'deleted' })
      .where(
        and(
          eq(reco.type, type),
          mediaCondition,
          eq(reco.userId, user.id),
          eq(reco.status, 'active')
        )
      )
      .returning();

    return plainToInstance(RecoDto, updatedRecos.map(({ movieId, tvSeriesId, ...rest }) => ({
      ...rest,
      mediaId: movieId ?? tvSeriesId,
    })));
  }

  async deleteById({
    id,
    user,
  }: {
    id: number;
    user: User;
  }): Promise<RecoDto> {
    const [existingReco] = await this.db
      .select()
      .from(reco)
      .where(eq(reco.id, id))
      .limit(1);

    if (!existingReco) {
      throw new NotFoundException(`Reco with ID ${id} not found.`);
    }

    const isSender = existingReco.senderId === user.id;
    const isReceiver = existingReco.userId === user.id;

    if (!isSender && !isReceiver) {
      throw new ForbiddenException('You do not have permission to delete this reco.');
    }

    let resultReco: typeof reco.$inferSelect;

    if (isSender) {
      const [deletedReco] = await this.db
        .delete(reco)
        .where(eq(reco.id, id))
        .returning();
        
      resultReco = deletedReco;
    } else {
      const [updatedReco] = await this.db
        .update(reco)
        .set({ status: 'deleted' })
        .where(eq(reco.id, id))
        .returning();
        
      resultReco = updatedReco;
    }

    const { movieId, tvSeriesId, ...rest } = resultReco;
    
    return plainToInstance(RecoDto, {
      ...rest,
      mediaId: movieId ?? tvSeriesId,
    });
  }

  async complete({
    userId,
    type,
    mediaId,
    tx,
  }: {
    userId: string;
    type: typeof recoTypeEnum.enumValues[number];
    mediaId: number;
    tx?: DbTransaction;
  }): Promise<RecoDto[]> {
    const dbClient = tx || this.db;

    const completedRecos = await dbClient
      .update(reco)
      .set({ 
        status: 'completed',
      })
      .where(
        and(
          eq(reco.userId, userId),
          eq(reco.type, type),
          type === RecoType.MOVIE ? eq(reco.movieId, mediaId) : eq(reco.tvSeriesId, mediaId),
          eq(reco.status, 'active')
        )
      )
      .returning();

    if (completedRecos.length > 0) {
      this.notify.emit('reco:completed', {
        userId,
        senderIds: completedRecos.map(r => r.senderId),
        mediaId,
        type,
      });
    }

    return plainToInstance(RecoDto, completedRecos.map(({ movieId, tvSeriesId, ...rest }) => ({
      ...rest,
      mediaId: movieId ?? tvSeriesId,
    })));
  }
}
