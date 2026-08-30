import { asc, eq, SQL } from 'drizzle-orm';
import { DbTransaction } from '@libs/db';
import { pinnedItem, playlist } from '@libs/db/schemas';
import { DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import { canViewPlaylist } from '../playlists/playlists.permission';
import { PINNED_ITEM_RULES } from '../../config/validation-rules';
import { PinnedItemStatus } from './dto/pinned.dto';

export interface PinnedItemStatusSignal {
  id: number;
  userId: string;
  rank: string;
  status: PinnedItemStatus;
}

export async function computePinnedItemStatusSignals({
  tx,
  currentUser,
  isPremium,
}: {
  tx: DbTransaction | DrizzleService;
  currentUser: User;
  isPremium: boolean;
}): Promise<PinnedItemStatusSignal[]> {
  const actualLimit = isPremium ? PINNED_ITEM_RULES.MAX.PREMIUM : PINNED_ITEM_RULES.MAX.FREE;

  const rows = await tx
    .select({
      id: pinnedItem.id,
      userId: pinnedItem.userId,
      rank: pinnedItem.rank,
      type: pinnedItem.type,
      playlistAccessible: canViewPlaylist(tx, currentUser) as SQL<boolean>,
    })
    .from(pinnedItem)
    .leftJoin(playlist, eq(pinnedItem.playlistId, playlist.id))
    .where(eq(pinnedItem.userId, currentUser.id))
    .orderBy(asc(pinnedItem.rank), asc(pinnedItem.id));

  return rows.map((row, index) => ({
    id: row.id,
    userId: row.userId,
    rank: row.rank,
    status:
      row.type === 'playlist' && !row.playlistAccessible
        ? PinnedItemStatus.UNAVAILABLE
        : index >= actualLimit
          ? PinnedItemStatus.OVER_LIMIT
          : PinnedItemStatus.AVAILABLE,
  }));
}
