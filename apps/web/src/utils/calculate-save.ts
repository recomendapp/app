
interface Price {
	unit_amount: number;
	interval: 'monthly' | 'yearly';
}

const calculateSave = (currentPrice: Price, previousPrice: Price) => {
	const currentPricePerMonth = 
		currentPrice?.interval === 'yearly' 
			? (currentPrice?.unit_amount ?? 0) / 12 
			: currentPrice?.unit_amount ?? 0;

	const previousPricePerMonth = 
		previousPrice?.interval === 'yearly'
			? (previousPrice?.unit_amount ?? 0) / 12
			: previousPrice?.unit_amount ?? 0;

	return Math.floor(
		(1 - currentPricePerMonth / previousPricePerMonth) * 100
	);
};

export {
	calculateSave
}