import { defaultSupportedLocale, SupportedLocale } from "../locales";

/**
 * Get the fallback language for a given locale
 * 
 * @param locale - The locale to get the fallback language for
 * @returns The fallback language or null if the locale is the default
 * @category i18n
 * @module getFallbackLanguage
 *
 * @example
 * ```tsx
 * const fallbackLanguage = getFallbackLanguage({ locale: 'fr-CA' });
 * ```
 * @example
 * ```tsx
 * const fallbackLanguage = getFallbackLanguage({ locale: 'en' });
 * ```
 */
export const getFallbackLocale = ({
	locale
} : {
	locale: SupportedLocale
}): SupportedLocale | null => {
	if (locale === defaultSupportedLocale) return null;
	switch (locale) {
		// // English
		// case 'en-AG':
		// case 'en-AU':
		// case 'en-BB':
		// case 'en-BZ':
		// case 'en-CA':
		// case 'en-CM':
		// case 'en-GB':
		// case 'en-GG':
		// case 'en-GH':
		// case 'en-GI':
		// case 'en-GY':
		// case 'en-IE':
		// case 'en-JM':
		// case 'en-KE':
		// case 'en-LC':
		// case 'en-MW':
		// case 'en-NZ':
		// case 'en-PG':
		// case 'en-TC':
		// case 'en-ZM':
		// case 'en-ZW':
		// 	return 'en-US';
		// // French
		// case 'fr-BF':
		// case 'fr-CA':
		// case 'fr-CD':
		// case 'fr-CI':
		// case 'fr-GF':
		// case 'fr-GP':
		// case 'fr-MC':
		// case 'fr-ML':
		// case 'fr-MU':
		// case 'fr-PF':
		// 	return 'fr-FR';
		// // Arabic
		// case 'ar-AE':
		// case 'ar-BH':
		// case 'ar-EG':
		// case 'ar-IQ':
		// case 'ar-JO':
		// case 'ar-LY':
		// case 'ar-MA':
		// case 'ar-QA':
		// case 'ar-TD':
		// case 'ar-YE':
		// 	return 'ar-SA';
		// // Spanish
		// case 'es-AR':
		// case 'es-CL':
		// case 'es-DO':
		// case 'es-EC':
		// case 'es-GQ':
		// case 'es-GT':
		// case 'es-HN':
		// case 'es-MX':
		// case 'es-NI':
		// case 'es-PA':
		// case 'es-PE':
		// case 'es-PY':
		// case 'es-SV':
		// case 'es-UY':
		// 	return 'es-ES';
		// // Russian
		// case 'be-BY':
		// case 'uk-UA':
		// case 'kk-KZ':
		// case 'ky-KG':
		// case 'uz-UZ':
		// 	return 'ru-RU';

		// // Default fallbacks
		// case 'af-ZA':
		// case 'ar-SA':
		// case 'es-ES':
		// case 'ru-RU':
		// case 'fr-FR':
		default:
			return defaultSupportedLocale;
	};
};
