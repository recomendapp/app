export interface IPinnedItemReorderedSignal {
  id: number;
  userId: string;
  rank: string;
  status: 'available' | 'unavailable' | 'over_limit';
}

export interface IPinnedItemsDeletedSignal {
  userId: string;
  deleted: number[];
  updated: IPinnedItemReorderedSignal[];
}
