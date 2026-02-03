import { useAuth } from "@/context/auth-context";
import { ErrorCode, Offering, Package, Purchases } from "@revenuecat/purchases-js";
import { useCallback, useEffect, useMemo, useState } from "react";

export const webReset = () => {
	// Remove all styles from the html and body tags after completing RevenueCat purchase
	// this is needed as during the purchase process, the body tag is styled with styles which
	// override the default styles of the Expo app
	["html", "body"].forEach((tag) =>
		document.querySelector(tag)?.removeAttribute("style")
	);
};

export const useOffering = () => {
	const { session, customerInfo } = useAuth();
	const isConfigured = useMemo(() => customerInfo !== undefined, [customerInfo]);
	const [offering, setOffering] = useState<Offering | null | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);

	const purchasePackage = useCallback(async (pkg: Package) => {
		try {
			if (!session) {
				throw new Error("User not logged in");
			}
			const { customerInfo } = await Purchases.getSharedInstance().purchase({
				customerEmail: session.user.email || undefined,
				rcPackage: pkg,
			});
			return customerInfo;
		} catch (error) {
			console.error(error);
			if (error === ErrorCode.UserCancelledError) {
				return null;
			}
		} finally {
			webReset();
		}
	}, [session]);

	const fetchOffering = useCallback(async () => {
		try {
			setIsLoading(true);
			const offerings = await Purchases.getSharedInstance().getOfferings();
			setOffering(offerings.current)
		} catch (error) {
			console.log("Error fetching packages:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isConfigured) return;

		fetchOffering();
	}, [isConfigured, fetchOffering]);

	return { offering, isLoading, purchasePackage };
};