import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { AuthProvider } from "./AuthProvider";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { BottomSheetManager } from "apps/mobile/src/components/bottom-sheets/BottomSheetManager";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { SplashScreenProvider } from "./SplashScreenProvider";
import { LocaleProvider } from "./LocaleProvider";
import { NotificationsProvider } from "./NotificationsProvider";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PropsWithChildren } from "react";
import { ToastProvider } from "apps/mobile/src/components/Toast";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ApiProvider } from "./ApiProvider";
import { useQuery } from "@tanstack/react-query";
import { uiBackgroundsOptions } from "../api/ui/uiOptions";

type ProvidersProps = {
	children: React.ReactNode;
};

const Providers = ({ children } : ProvidersProps) => {
	return (
	<GestureHandlerRootView style={{ flex: 1 }}>	
		<KeyboardProvider>
			<SafeAreaProvider initialMetrics={initialWindowMetrics}>
				<SplashScreenProvider>
					<LocaleProvider>
						<ThemeProvider>
							<ToastProvider>
								<ActionSheetProvider>
									<ReactQueryProvider>
										<AuthProvider>
											<ApiProvider>
												<BottomSheetModalProvider>
													<NotificationsProvider>
														<ProvidersInner>
															{children}
														</ProvidersInner>
														<BottomSheetManager />
													</NotificationsProvider>
												</BottomSheetModalProvider>
											</ApiProvider>
										</AuthProvider>
									</ReactQueryProvider>
								</ActionSheetProvider>
							</ToastProvider>
						</ThemeProvider>
					</LocaleProvider>
				</SplashScreenProvider>
			</SafeAreaProvider>
		</KeyboardProvider>
	</GestureHandlerRootView>
	)
};

const ProvidersInner = ({ children } : PropsWithChildren) => {
	useQuery(uiBackgroundsOptions()); // Preload UI backgrounds
	return children;
};

export { Providers };