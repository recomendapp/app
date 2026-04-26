import { authCustomerInfoOptions } from "apps/mobile/src/api/auth/authOptions";
import { Button } from "apps/mobile/src/components/ui/Button";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, Stack, useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomerInfo } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from "react-native-reanimated"; // Imports d'animation
import { useTranslations } from "use-intl";
import * as Haptics from "expo-haptics";
import { useUserCacheUpdate } from "@libs/query-client";
import { uiBackgroundsOptions } from "../api/ui/uiOptions";
import useRandomBackdrop from "../hooks/useRandomBackdrop";
import { Image } from "expo-image";
import { View } from "../components/ui/view";

const PremiumSuccess = ({ onClose } : { onClose: () => void }) => {
	const { colors } = useTheme();
	const t = useTranslations();

    const {
        data,
    } = useQuery(uiBackgroundsOptions());
    const backgrounds = useMemo(() => data?.map(bg => bg.localUri) || [], [data]);
    const bg = useRandomBackdrop(backgrounds);

    useEffect(() => {
        const intervalDuration = 200; 
        const totalDuration = 1000;

        const hapticInterval = setInterval(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }, intervalDuration);

        const timeout = setTimeout(() => {
            clearInterval(hapticInterval);
        }, totalDuration);

        return () => {
            clearInterval(hapticInterval);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <Animated.View 
            style={tw`flex-1 justify-center items-center gap-4 bg-background px-6`}
            exiting={FadeOut.duration(300)}
        >
            {bg && (
                <Animated.View entering={FadeIn.duration(2000)} style={tw`absolute inset-0`}>
                    <Image
                        
                        source={{ uri: bg }}
                        style={tw`absolute inset-0`}
                    />
                    <View style={tw`absolute inset-0 bg-black/50`} />
                </Animated.View>
            )}
            <Animated.Text 
                entering={FadeInDown.duration(600).springify()}
                style={[
					{ color: colors.foreground },
					tw`text-3xl font-bold text-center mb-4`
				]}
            >
                {upperFirst(t('pages.upgrade.subscription.success.label'))}
            </Animated.Text>
            <Button onPress={onClose}>
                {upperFirst(t('common.messages.lets_go'))}
            </Button>
        </Animated.View>
    )
};

const UpgradeScreen = () => {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const updateUserCache = useUserCacheUpdate();
    const t = useTranslations();
    const { defaultScreenOptions, isLiquidGlassAvailable } = useTheme();
    
    const [isSuccess, setIsSuccess] = useState(false);
    
    const handleClose = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    const onSuccess = useCallback(async ({ customerInfo } : { customerInfo: CustomerInfo }) => {
        queryClient.setQueryData(authCustomerInfoOptions().queryKey, customerInfo);
        if (user && !!customerInfo.entitlements.active['premium']) {
            updateUserCache(user, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    isPremium: true,
                };
            });
        }
        setIsSuccess(true);
    }, [queryClient, updateUserCache, user]);

    if (!user) return <Redirect href={'/auth/login'} />
    
    return (
    <>
        <Stack.Screen
            options={{
                ...defaultScreenOptions,
                headerTitle: upperFirst(t('common.messages.upgrade')),
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerLeft: () => (
                    <Button variant="muted" icon={Icons.X} size="icon" style={tw`rounded-full`} onPress={handleClose} />
                ),
                unstable_headerLeftItems: isLiquidGlassAvailable ? (props) => [
                {
                    type: "button",
                    label: upperFirst(t('common.messages.close')),
                    onPress: handleClose,
                    icon: {
                        name: "xmark",
                        type: "sfSymbol",
                    },
                },
                ] : undefined,
            }}
        />
        
        <Animated.View style={tw`flex-1 bg-background`}>
            {isSuccess ? (
                <PremiumSuccess onClose={handleClose} />
            ) : (
                <RevenueCatUI.Paywall 
                    onPurchaseCompleted={onSuccess} 
                    onRestoreCompleted={onSuccess} 
                />
            )}
        </Animated.View>
    </>
    )
};

export default UpgradeScreen;