import { CustomerInfo, Purchases } from "@revenuecat/purchases-js";
import { queryOptions } from "@tanstack/react-query";
import { authKeys } from "../keys/authKeys";

export const useAuthCustomerInfoOptions = ({
	initialData,
	enabled = true,
} : {
	initialData?: CustomerInfo;
	enabled?: boolean;
}) => {
	return queryOptions({
		queryKey: authKeys.customerInfo(),
		queryFn: async () => {
			return await Purchases.getSharedInstance().getCustomerInfo();
		},
		retry: 3,
		retryOnMount: true,
		initialData,
		enabled,
	});
};