import * as React from "react"

export type Device = "mobile" | "tablet" | "desktop"

export function useDevice({
	device: deviceProps,
} : {
	device: Device;
}) {
	const [device, setDevice] = React.useState(deviceProps);

	const getDevice = React.useCallback((): Device => {
		const userAgent = navigator.userAgent.toLowerCase();
		const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
		const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
		
		if (isMobile) {
		  return "mobile";
		} else if (isTablet) {
		  return "tablet";
		} else {
		  return "desktop";
		}
	}, []);

	React.useEffect(() => {
		const handleResize = () => {
			setDevice(getDevice());
		}
		handleResize();

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [getDevice]);

	return device;
}