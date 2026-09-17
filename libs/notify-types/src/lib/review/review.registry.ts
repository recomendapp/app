import {
  NotifyReviewCommentedDto,
  NotifyReviewCommentLikedDto,
  NotifyReviewCommentRepliedDto,
  NotifyReviewLikedDto,
} from './review.dto';

export type NotifyReviewRegistry = {
  'review:liked': NotifyReviewLikedDto;
  'review:commented': NotifyReviewCommentedDto;
  'review-comment:liked': NotifyReviewCommentLikedDto;
  'review-comment:replied': NotifyReviewCommentRepliedDto;
};
