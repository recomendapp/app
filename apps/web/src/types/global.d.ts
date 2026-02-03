import { routing } from '@/lib/i18n/routing';
import en from '@/translations/dictionaries/en-US.json';

declare module 'next-intl' {
	interface AppConfig {
		Locale: (typeof routing.locales)[number];
		Messages: typeof en;
	}
}