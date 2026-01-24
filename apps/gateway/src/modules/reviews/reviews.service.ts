import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, ReviewMovieDto, ReviewTvSeriesDto } from './dto';
import DOMPurify from 'isomorphic-dompurify';
import { SupabaseAdminClient } from 'apps/gateway/src/common/supabase/supabase-admin-client';

@Injectable()
export class ReviewsService {
  constructor(private readonly supabase: SupabaseAdminClient) {}

  async upsertMovieReview(
    userId: string,
    movieId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewMovieDto> {
    const { data: activity, error: activityError } = await this.supabase
      .from('user_activities_movie')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();

    if (activityError || !activity) {
      throw new NotFoundException(
        `Activity for movie with id ${movieId} not found for this user.`,
      );
    }

    const sanitizedBody = DOMPurify.sanitize(createReviewDto.body);
    const wrappedHtml = `<html>${sanitizedBody}</html>`;

    const { data, error } = await this.supabase
      .from('user_reviews_movie')
      .upsert(
        {
          id: activity.id,
          title: createReviewDto.title,
          body: wrappedHtml,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single();

    if (error) {
      throw new Error(`Could not upsert movie review: ${error.message}`);
    }

    return data;
  }

  async upsertTvSeriesReview(
    userId: string,
    tvSeriesId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewTvSeriesDto> {
    const { data: activity, error: activityError } = await this.supabase
      .from('user_activities_tv_series')
      .select('id')
      .eq('user_id', userId)
      .eq('tv_series_id', tvSeriesId)
      .single();

    if (activityError || !activity) {
      throw new NotFoundException(
        `Activity for TV series with id ${tvSeriesId} not found for this user.`,
      );
    }

    const sanitizedBody = DOMPurify.sanitize(createReviewDto.body);
    const wrappedHtml = `<html>${sanitizedBody}</html>`;

    const { data, error } = await this.supabase
      .from('user_reviews_tv_series')
      .upsert(
        {
          id: activity.id,
          title: createReviewDto.title,
          body: wrappedHtml,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single();

    if (error) {
      throw new Error(`Could not upsert TV series review: ${error.message}`);
    }

    return data;
  }
}
