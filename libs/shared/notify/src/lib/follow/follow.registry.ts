import { 
  NotifyFollowAcceptedDto, 
  NotifyFollowNewDto, 
  NotifyFollowRequestDto 
} from './follow.dto';

export type NotifyFollowRegistry = {
  'follow:new': NotifyFollowNewDto;
  'follow:request': NotifyFollowRequestDto;
  'follow:accepted': NotifyFollowAcceptedDto;
};