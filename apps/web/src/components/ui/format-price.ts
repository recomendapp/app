const formatPrice = (price: { currency?: string | null, unit_amount: number }, language: string) => {
  if (!price?.currency) return '';
  const priceString = new Intl.NumberFormat(language, {
	style: 'currency',
	currency: price?.currency,
	minimumFractionDigits: 0,
  }).format((price?.unit_amount || 0) / 100);

  return priceString;
};

export {
	formatPrice
}
