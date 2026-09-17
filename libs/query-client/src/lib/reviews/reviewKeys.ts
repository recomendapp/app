import {
  ReviewMovieLikesControllerListPaginatedData,
  ReviewMovieLikesControllerListInfiniteData,
  ReviewMovieCommentsControllerListPaginatedData,
  ReviewMovieCommentsControllerListInfiniteData,
  ReviewMovieCommentsControllerListRepliesPaginatedData,
  ReviewMovieCommentsControllerListRepliesInfiniteData,
  ReviewMovieCommentLikesControllerListPaginatedData,
  ReviewMovieCommentLikesControllerListInfiniteData,
  ReviewTvSeriesLikesControllerListPaginatedData,
  ReviewTvSeriesLikesControllerListInfiniteData,
  ReviewTvSeriesCommentsControllerListPaginatedData,
  ReviewTvSeriesCommentsControllerListInfiniteData,
  ReviewTvSeriesCommentsControllerListRepliesPaginatedData,
  ReviewTvSeriesCommentsControllerListRepliesInfiniteData,
  ReviewTvSeriesCommentLikesControllerListPaginatedData,
  ReviewTvSeriesCommentLikesControllerListInfiniteData,
} from '@libs/api-js';

export const reviewMovieKeys = {
  base: ['review', 'movie'] as const,

  details: ({ id }: { id: number }) => [...reviewMovieKeys.base, id] as const,

  /* ---------------------------------- Likes --------------------------------- */
  like: ({ id }: { id: number }) => [...reviewMovieKeys.details({ id }), 'like'] as const,

  likes: ({
    id,
    mode,
    filters,
  }: {
    id: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewMovieLikesControllerListPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<NonNullable<ReviewMovieLikesControllerListInfiniteData['query']>, 'cursor'>;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [...reviewMovieKeys.details({ id }), 'likes', ...optionsKey] as const;
  },

  /* -------------------------------- Comments -------------------------------- */
  comments: ({
    id,
    mode,
    filters,
  }: {
    id: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewMovieCommentsControllerListPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewMovieCommentsControllerListInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [...reviewMovieKeys.details({ id }), 'comments', ...optionsKey] as const;
  },

  commentDetails: ({ id, commentId }: { id: number; commentId: number }) =>
    [...reviewMovieKeys.details({ id }), 'comment', commentId] as const,

  commentReplies: ({
    id,
    commentId,
    mode,
    filters,
  }: {
    id: number;
    commentId: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewMovieCommentsControllerListRepliesPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewMovieCommentsControllerListRepliesInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [
      ...reviewMovieKeys.commentDetails({ id, commentId }),
      'replies',
      ...optionsKey,
    ] as const;
  },

  /* ----------------------------- Comment likes ----------------------------- */
  commentLike: ({ id, commentId }: { id: number; commentId: number }) =>
    [...reviewMovieKeys.commentDetails({ id, commentId }), 'like'] as const,

  commentLikes: ({
    id,
    commentId,
    mode,
    filters,
  }: {
    id: number;
    commentId: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewMovieCommentLikesControllerListPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewMovieCommentLikesControllerListInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [...reviewMovieKeys.commentDetails({ id, commentId }), 'likes', ...optionsKey] as const;
  },
};

export const reviewTvSeriesKeys = {
  base: ['review', 'tv-series'] as const,

  details: ({ id }: { id: number }) => [...reviewTvSeriesKeys.base, id] as const,

  /* ---------------------------------- Likes --------------------------------- */
  like: ({ id }: { id: number }) => [...reviewTvSeriesKeys.details({ id }), 'like'] as const,

  likes: ({
    id,
    mode,
    filters,
  }: {
    id: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewTvSeriesLikesControllerListPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewTvSeriesLikesControllerListInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [...reviewTvSeriesKeys.details({ id }), 'likes', ...optionsKey] as const;
  },

  /* -------------------------------- Comments -------------------------------- */
  comments: ({
    id,
    mode,
    filters,
  }: {
    id: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewTvSeriesCommentsControllerListPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewTvSeriesCommentsControllerListInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [...reviewTvSeriesKeys.details({ id }), 'comments', ...optionsKey] as const;
  },

  commentDetails: ({ id, commentId }: { id: number; commentId: number }) =>
    [...reviewTvSeriesKeys.details({ id }), 'comment', commentId] as const,

  commentReplies: ({
    id,
    commentId,
    mode,
    filters,
  }: {
    id: number;
    commentId: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewTvSeriesCommentsControllerListRepliesPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewTvSeriesCommentsControllerListRepliesInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [
      ...reviewTvSeriesKeys.commentDetails({ id, commentId }),
      'replies',
      ...optionsKey,
    ] as const;
  },

  /* ----------------------------- Comment likes ----------------------------- */
  commentLike: ({ id, commentId }: { id: number; commentId: number }) =>
    [...reviewTvSeriesKeys.commentDetails({ id, commentId }), 'like'] as const,

  commentLikes: ({
    id,
    commentId,
    mode,
    filters,
  }: {
    id: number;
    commentId: number;
  } & (
    | { mode?: never; filters?: never }
    | {
        mode: 'paginated';
        filters?: NonNullable<ReviewTvSeriesCommentLikesControllerListPaginatedData['query']>;
      }
    | {
        mode: 'infinite';
        filters?: Omit<
          NonNullable<ReviewTvSeriesCommentLikesControllerListInfiniteData['query']>,
          'cursor'
        >;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [
      ...reviewTvSeriesKeys.commentDetails({ id, commentId }),
      'likes',
      ...optionsKey,
    ] as const;
  },
};
