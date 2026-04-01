import { forwardRef, useRef } from "react";
import { BottomSheetProps } from "../../BottomSheetManager";
import { Playlist } from "@recomendapp/types";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ShareViewRef } from "apps/mobile/src/components/share/type";
import BottomSheetShareLayout from "./BottomSheetShareLayout"; // Importer le layout
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { SharePlaylist } from "apps/mobile/src/components/share/SharePlaylist";

interface BottomSheetSharePlaylistProps extends BottomSheetProps {
    playlist: Playlist;
}

const BottomSheetSharePlaylist = forwardRef<
    React.ComponentRef<typeof TrueSheet>,
    BottomSheetSharePlaylistProps
>(({
    playlist,
    ...props
}, ref) => {
    const { customerInfo } = useAuth();
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
            isPremium={!!customerInfo?.entitlements.active['premium']}
            />
        </BottomSheetShareLayout>
    );
});

BottomSheetSharePlaylist.displayName = "BottomSheetSharePlaylist";

export default BottomSheetSharePlaylist;