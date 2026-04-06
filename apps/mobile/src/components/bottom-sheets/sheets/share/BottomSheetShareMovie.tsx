import { forwardRef, useRef } from "react";
import { BottomSheetProps } from "../../BottomSheetManager";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ShareViewRef } from "apps/mobile/src/components/share/type";
import BottomSheetShareLayout from "./BottomSheetShareLayout"; // Importer le layout
import { ShareMovie } from "apps/mobile/src/components/share/ShareMovie";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { MovieCompact } from "@packages/api-js";

interface BottomSheetShareMovieProps extends BottomSheetProps {
    movie: MovieCompact;
}

const BottomSheetShareMovie = forwardRef<
    React.ComponentRef<typeof TrueSheet>,
    BottomSheetShareMovieProps
>(({
    movie,
    ...props
}, ref) => {
    const { customerInfo } = useAuth();
    const shareViewRef = useRef<ShareViewRef>(null);
    return (
        <BottomSheetShareLayout
        ref={ref}
        path={movie.url || `/film/${movie.slug || movie.id}`}
        contentRef={shareViewRef} 
        {...props}
        >
            <ShareMovie
			ref={shareViewRef}
			movie={movie}
			isPremium={!!customerInfo?.entitlements.active['premium']}
			/>
        </BottomSheetShareLayout>
    );
});

BottomSheetShareMovie.displayName = "BottomSheetShareMovie";

export default BottomSheetShareMovie;