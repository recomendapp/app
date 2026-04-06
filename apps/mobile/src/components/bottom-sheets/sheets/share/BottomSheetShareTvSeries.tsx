import { forwardRef, useRef } from "react";
import { BottomSheetProps } from "../../BottomSheetManager";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ShareViewRef } from "apps/mobile/src/components/share/type";
import BottomSheetShareLayout from "./BottomSheetShareLayout"; // Importer le layout
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { ShareTvSeries } from "apps/mobile/src/components/share/ShareTvSeries";
import { TvSeriesCompact } from "@packages/api-js";

interface BottomSheetShareTvSeriesProps extends BottomSheetProps {
    tvSeries: TvSeriesCompact;
}

const BottomSheetShareTvSeries = forwardRef<
    React.ComponentRef<typeof TrueSheet>,
    BottomSheetShareTvSeriesProps
>(({
    tvSeries,
    ...props
}, ref) => {
    const { customerInfo } = useAuth();
    const shareViewRef = useRef<ShareViewRef>(null);
    return (
        <BottomSheetShareLayout
        ref={ref}
        path={tvSeries.url || `/tv-series/${tvSeries.slug || tvSeries.id}`}
        contentRef={shareViewRef} 
        {...props}
        >
            <ShareTvSeries
			ref={shareViewRef}
			tvSeries={tvSeries}
			isPremium={!!customerInfo?.entitlements.active['premium']}
			/>
        </BottomSheetShareLayout>
    );
});

BottomSheetShareTvSeries.displayName = "BottomSheetShareTvSeries";

export default BottomSheetShareTvSeries;