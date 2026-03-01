import { NotifyRecoCompletedDto, NotifyRecoReceivedDto } from './reco.dto';

export type NotifyRecoRegistry = {
  'reco:received': NotifyRecoReceivedDto;
  'reco:completed': NotifyRecoCompletedDto;
};