import { forwardRef, useRef } from 'react';
import { BottomSheetProps } from '../../BottomSheetManager';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ShareViewRef } from '../../../share/type';
import BottomSheetShareLayout from './BottomSheetShareLayout'; // Importer le layout
import { useAuth } from '../../../../providers/AuthProvider';
import { SharePlaylist } from '../../../share/SharePlaylist';
import { Playlist, UserSummary } from '@libs/api-js';

interface BottomSheetSharePlaylistProps extends BottomSheetProps {
  playlist: Playlist;
  owner?: UserSummary;
}

const BottomSheetSharePlaylist = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetSharePlaylistProps
>(({ playlist, owner, ...props }, ref) => {
  const { user } = useAuth();
  const shareViewRef = useRef<ShareViewRef>(null);
  return (
    <BottomSheetShareLayout
      ref={ref}
      path={`/playlist/${playlist.id}`}
      contentRef={shareViewRef}
      {...props}
    >
      <SharePlaylist
        ref={shareViewRef}
        playlist={playlist}
        owner={owner}
        isPremium={!!user?.isPremium}
      />
    </BottomSheetShareLayout>
  );
});

BottomSheetSharePlaylist.displayName = 'BottomSheetSharePlaylist';

export default BottomSheetSharePlaylist;
