import { forwardRef, useRef } from "react";
import { BottomSheetProps } from "../../BottomSheetManager";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ShareViewRef } from "apps/mobile/src/components/share/type";
import BottomSheetShareLayout from "./BottomSheetShareLayout"; // Importer le layout
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { SharePerson } from "apps/mobile/src/components/share/SharePerson";
import { PersonCompact } from "@packages/api-js";

interface BottomSheetSharePersonProps extends BottomSheetProps {
    person: PersonCompact;
}

const BottomSheetSharePerson = forwardRef<
    React.ComponentRef<typeof TrueSheet>,
    BottomSheetSharePersonProps
>(({
    person,
    ...props
}, ref) => {
    const { customerInfo } = useAuth();
    const shareViewRef = useRef<ShareViewRef>(null);
    return (
        <BottomSheetShareLayout
        ref={ref}
        path={person.url || `/person/${person.slug || person.id}`}
        contentRef={shareViewRef} 
        {...props}
        >
            <SharePerson
            ref={shareViewRef}
            person={person}
            isPremium={!!customerInfo?.entitlements.active['premium']}
            />
        </BottomSheetShareLayout>
    );
});

BottomSheetSharePerson.displayName = "BottomSheetSharePerson";

export default BottomSheetSharePerson;