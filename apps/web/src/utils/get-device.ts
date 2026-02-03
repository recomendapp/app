import { headers } from "next/headers";

export type Device = "mobile" | "tablet" | "desktop";

export const getServerDevice = async (): Promise<Device> => {
	const userAgent = (await headers()).get("user-agent")?.toLowerCase() || "";

	const isMobile = /iphone|ipod|android.*mobile|blackberry|windows phone/g.test(userAgent);
	const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);

	if (isMobile) return "mobile";
	if (isTablet) return "tablet";
	return "desktop";
};
