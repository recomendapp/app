import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { reviewMovieKeys, reviewTvSeriesKeys } from './reviewKeys';
import {
  reviewMovieLikesControllerGetLikeStatus,
  reviewMovieLikesControllerListPaginated,
  reviewMovieLikesControllerListInfinite,
  ReviewMovieLikesControllerListPaginatedData,
  ReviewMovieLikesControllerListInfiniteData,
  reviewTvSeriesLikesControllerGetLikeStatus,
  reviewTvSeriesLikesControllerListPaginated,
  reviewTvSeriesLikesControllerListInfinite,
  ReviewTvSeriesLikesControllerListPaginatedData,
  ReviewTvSeriesLikesControllerListInfiniteData,
  reviewMovieCommentsControllerListPaginated,
  reviewMovieCommentsControllerListInfinite,
  reviewMovieCommentsControllerListRepliesPaginated,
  reviewMovieCommentsControllerListRepliesInfinite,
  ReviewMovieCommentsControllerListPaginatedData,
  ReviewMovieCommentsControllerListInfiniteData,
  ReviewMovieCommentsControllerListRepliesPaginatedData,
  ReviewMovieCommentsControllerListRepliesInfiniteData,
  reviewTvSeriesCommentsControllerListPaginated,
  reviewTvSeriesCommentsControllerListInfinite,
  reviewTvSeriesCommentsControllerListRepliesPaginated,
  reviewTvSeriesCommentsControllerListRepliesInfinite,
  ReviewTvSeriesCommentsControllerListPaginatedData,
  ReviewTvSeriesCommentsControllerListInfiniteData,
  ReviewTvSeriesCommentsControllerListRepliesPaginatedData,
  ReviewTvSeriesCommentsControllerListRepliesInfiniteData,
  reviewMovieCommentLikesControllerGetLikeStatus,
  reviewMovieCommentLikesControllerListPaginated,
  reviewMovieCommentLikesControllerListInfinite,
  ReviewMovieCommentLikesControllerListPaginatedData,
  ReviewMovieCommentLikesControllerListInfiniteData,
  reviewTvSeriesCommentLikesControllerGetLikeStatus,
  reviewTvSeriesCommentLikesControllerListPaginated,
  reviewTvSeriesCommentLikesControllerListInfinite,
  ReviewTvSeriesCommentLikesControllerListPaginatedData,
  ReviewTvSeriesCommentLikesControllerListInfiniteData,
} from '@libs/api-js';

export const reviewMovieLikeOptions = ({
  userId,
  reviewId,
}: {
  userId?: string;
  reviewId?: number;
}) => {
  return queryOptions({
    queryKey: reviewMovieKeys.like({
      id: reviewId!,
    }),
    queryFn: async () => {
      if (!reviewId) throw Error('Review ID is required');
      const { data, error } = await reviewMovieLikesControllerGetLikeStatus({
        path: {
          review_id: reviewId,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!userId && !!reviewId,
  });
};

export const reviewTvSeriesLikeOptions = ({
  userId,
  reviewId,
}: {
  userId?: string;
  reviewId?: number;
}) => {
  return queryOptions({
    queryKey: reviewTvSeriesKeys.like({
      id: reviewId!,
    }),
    queryFn: async () => {
      if (!reviewId) throw Error('Review ID is required');
      const { data, error } = await reviewTvSeriesLikesControllerGetLikeStatus({
        path: {
          review_id: reviewId,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!userId && !!reviewId,
  });
};

/* ------------------------------ Likes (list) ------------------------------ */
export const reviewMovieLikesPaginatedOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: NonNullable<ReviewMovieLikesControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewMovieKeys.likes({
      id: reviewId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewMovieLikesControllerListPaginated({
        path: {
          review_id: reviewId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId,
  });
};
export const reviewMovieLikesInfiniteOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: Omit<NonNullable<ReviewMovieLikesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewMovieKeys.likes({
      id: reviewId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewMovieLikesControllerListInfinite({
        path: {
          review_id: reviewId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId,
  });
};

export const reviewTvSeriesLikesPaginatedOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: NonNullable<ReviewTvSeriesLikesControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewTvSeriesKeys.likes({
      id: reviewId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewTvSeriesLikesControllerListPaginated({
        path: {
          review_id: reviewId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId,
  });
};
export const reviewTvSeriesLikesInfiniteOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: Omit<NonNullable<ReviewTvSeriesLikesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewTvSeriesKeys.likes({
      id: reviewId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewTvSeriesLikesControllerListInfinite({
        path: {
          review_id: reviewId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId,
  });
};

/* --------------------------------- Comments -------------------------------- */
export const reviewMovieCommentsPaginatedOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: NonNullable<ReviewMovieCommentsControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewMovieKeys.comments({
      id: reviewId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewMovieCommentsControllerListPaginated({
        path: {
          review_id: reviewId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId,
  });
};
export const reviewMovieCommentsInfiniteOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: Omit<NonNullable<ReviewMovieCommentsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewMovieKeys.comments({
      id: reviewId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewMovieCommentsControllerListInfinite({
        path: {
          review_id: reviewId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId,
  });
};

export const reviewTvSeriesCommentsPaginatedOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: NonNullable<ReviewTvSeriesCommentsControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewTvSeriesKeys.comments({
      id: reviewId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewTvSeriesCommentsControllerListPaginated({
        path: {
          review_id: reviewId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId,
  });
};
export const reviewTvSeriesCommentsInfiniteOptions = ({
  reviewId,
  filters,
}: {
  reviewId?: number;
  filters?: Omit<NonNullable<ReviewTvSeriesCommentsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewTvSeriesKeys.comments({
      id: reviewId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      const { data, error } = await reviewTvSeriesCommentsControllerListInfinite({
        path: {
          review_id: reviewId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId,
  });
};

/* ----------------------------- Comment replies ----------------------------- */
export const reviewMovieCommentRepliesPaginatedOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: NonNullable<ReviewMovieCommentsControllerListRepliesPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewMovieKeys.commentReplies({
      id: reviewId!,
      commentId: commentId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewMovieCommentsControllerListRepliesPaginated({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId && !!commentId,
  });
};
export const reviewMovieCommentRepliesInfiniteOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: Omit<
    NonNullable<ReviewMovieCommentsControllerListRepliesInfiniteData['query']>,
    'cursor'
  >;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewMovieKeys.commentReplies({
      id: reviewId!,
      commentId: commentId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewMovieCommentsControllerListRepliesInfinite({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId && !!commentId,
  });
};

export const reviewTvSeriesCommentRepliesPaginatedOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: NonNullable<ReviewTvSeriesCommentsControllerListRepliesPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewTvSeriesKeys.commentReplies({
      id: reviewId!,
      commentId: commentId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewTvSeriesCommentsControllerListRepliesPaginated({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId && !!commentId,
  });
};
export const reviewTvSeriesCommentRepliesInfiniteOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: Omit<
    NonNullable<ReviewTvSeriesCommentsControllerListRepliesInfiniteData['query']>,
    'cursor'
  >;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewTvSeriesKeys.commentReplies({
      id: reviewId!,
      commentId: commentId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewTvSeriesCommentsControllerListRepliesInfinite({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId && !!commentId,
  });
};

/* ------------------------------- Comment like ------------------------------ */
export const reviewMovieCommentLikeOptions = ({
  userId,
  reviewId,
  commentId,
}: {
  userId?: string;
  reviewId?: number;
  commentId?: number;
}) => {
  return queryOptions({
    queryKey: reviewMovieKeys.commentLike({
      id: reviewId!,
      commentId: commentId!,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewMovieCommentLikesControllerGetLikeStatus({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!userId && !!reviewId && !!commentId,
  });
};

export const reviewTvSeriesCommentLikeOptions = ({
  userId,
  reviewId,
  commentId,
}: {
  userId?: string;
  reviewId?: number;
  commentId?: number;
}) => {
  return queryOptions({
    queryKey: reviewTvSeriesKeys.commentLike({
      id: reviewId!,
      commentId: commentId!,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewTvSeriesCommentLikesControllerGetLikeStatus({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!userId && !!reviewId && !!commentId,
  });
};

/* ---------------------------- Comment likes (list) -------------------------- */
export const reviewMovieCommentLikesPaginatedOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: NonNullable<ReviewMovieCommentLikesControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewMovieKeys.commentLikes({
      id: reviewId!,
      commentId: commentId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewMovieCommentLikesControllerListPaginated({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId && !!commentId,
  });
};
export const reviewMovieCommentLikesInfiniteOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: Omit<NonNullable<ReviewMovieCommentLikesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewMovieKeys.commentLikes({
      id: reviewId!,
      commentId: commentId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewMovieCommentLikesControllerListInfinite({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId && !!commentId,
  });
};

export const reviewTvSeriesCommentLikesPaginatedOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: NonNullable<ReviewTvSeriesCommentLikesControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: reviewTvSeriesKeys.commentLikes({
      id: reviewId!,
      commentId: commentId!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewTvSeriesCommentLikesControllerListPaginated({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!reviewId && !!commentId,
  });
};
export const reviewTvSeriesCommentLikesInfiniteOptions = ({
  reviewId,
  commentId,
  filters,
}: {
  reviewId?: number;
  commentId?: number;
  filters?: Omit<
    NonNullable<ReviewTvSeriesCommentLikesControllerListInfiniteData['query']>,
    'cursor'
  >;
}) => {
  return infiniteQueryOptions({
    queryKey: reviewTvSeriesKeys.commentLikes({
      id: reviewId!,
      commentId: commentId!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!reviewId) throw new Error('Review ID is required');
      if (!commentId) throw new Error('Comment ID is required');
      const { data, error } = await reviewTvSeriesCommentLikesControllerListInfinite({
        path: {
          review_id: reviewId,
          comment_id: commentId,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!reviewId && !!commentId,
  });
};
