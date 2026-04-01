import { useSplashScreen } from 'apps/mobile/src/providers/SplashScreenProvider'

export function Splash({ children}: React.PropsWithChildren) {
	const { isReady } = useSplashScreen();
	if (isReady) {
		return children
	}
	return null;
}
