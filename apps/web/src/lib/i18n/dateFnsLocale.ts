import type { Locale } from 'date-fns';
import type { SupportedLocale } from '@libs/i18n';

/**
 * The date-fns locale backing each supported locale, loaded on demand
 *
 * react-day-picker needs a date-fns `Locale` for month names, weekday headers
 * and the first day of the week -- `Intl` cannot feed it. Importing all 43 at
 * once would add ~170 KB to the bundle for one modal, so every entry is its
 * own chunk and only the chosen one is fetched.
 *
 * Most locales exist at language level only (de-DE -> de), a handful ship the
 * exact tag (pt-BR, zh-HK), and no-NO maps to nb: date-fns has Bokmal and
 * Nynorsk, not the macrolanguage.
 */
const DATE_FNS_LOCALES: Record<SupportedLocale, () => Promise<Locale>> = {
  'ar-SA': () => import('date-fns/locale/ar-SA').then((m) => m.arSA),
  'bg-BG': () => import('date-fns/locale/bg').then((m) => m.bg),
  'ca-ES': () => import('date-fns/locale/ca').then((m) => m.ca),
  'cs-CZ': () => import('date-fns/locale/cs').then((m) => m.cs),
  'da-DK': () => import('date-fns/locale/da').then((m) => m.da),
  'de-DE': () => import('date-fns/locale/de').then((m) => m.de),
  'el-GR': () => import('date-fns/locale/el').then((m) => m.el),
  'en-US': () => import('date-fns/locale/en-US').then((m) => m.enUS),
  'es-ES': () => import('date-fns/locale/es').then((m) => m.es),
  'es-MX': () => import('date-fns/locale/es').then((m) => m.es),
  'et-EE': () => import('date-fns/locale/et').then((m) => m.et),
  'fa-IR': () => import('date-fns/locale/fa-IR').then((m) => m.faIR),
  'fi-FI': () => import('date-fns/locale/fi').then((m) => m.fi),
  'fr-CA': () => import('date-fns/locale/fr-CA').then((m) => m.frCA),
  'fr-FR': () => import('date-fns/locale/fr').then((m) => m.fr),
  'he-IL': () => import('date-fns/locale/he').then((m) => m.he),
  'hi-IN': () => import('date-fns/locale/hi').then((m) => m.hi),
  'hr-HR': () => import('date-fns/locale/hr').then((m) => m.hr),
  'hu-HU': () => import('date-fns/locale/hu').then((m) => m.hu),
  'it-IT': () => import('date-fns/locale/it').then((m) => m.it),
  'ja-JP': () => import('date-fns/locale/ja').then((m) => m.ja),
  'ka-GE': () => import('date-fns/locale/ka').then((m) => m.ka),
  'ko-KR': () => import('date-fns/locale/ko').then((m) => m.ko),
  'lt-LT': () => import('date-fns/locale/lt').then((m) => m.lt),
  'lv-LV': () => import('date-fns/locale/lv').then((m) => m.lv),
  'nl-NL': () => import('date-fns/locale/nl').then((m) => m.nl),
  'no-NO': () => import('date-fns/locale/nb').then((m) => m.nb),
  'pl-PL': () => import('date-fns/locale/pl').then((m) => m.pl),
  'pt-BR': () => import('date-fns/locale/pt-BR').then((m) => m.ptBR),
  'pt-PT': () => import('date-fns/locale/pt').then((m) => m.pt),
  'ro-RO': () => import('date-fns/locale/ro').then((m) => m.ro),
  'ru-RU': () => import('date-fns/locale/ru').then((m) => m.ru),
  'sk-SK': () => import('date-fns/locale/sk').then((m) => m.sk),
  'sl-SI': () => import('date-fns/locale/sl').then((m) => m.sl),
  'sr-RS': () => import('date-fns/locale/sr').then((m) => m.sr),
  'sv-SE': () => import('date-fns/locale/sv').then((m) => m.sv),
  'th-TH': () => import('date-fns/locale/th').then((m) => m.th),
  'tr-TR': () => import('date-fns/locale/tr').then((m) => m.tr),
  'uk-UA': () => import('date-fns/locale/uk').then((m) => m.uk),
  'vi-VN': () => import('date-fns/locale/vi').then((m) => m.vi),
  'zh-CN': () => import('date-fns/locale/zh-CN').then((m) => m.zhCN),
  'zh-HK': () => import('date-fns/locale/zh-HK').then((m) => m.zhHK),
  'zh-TW': () => import('date-fns/locale/zh-TW').then((m) => m.zhTW),
};

/**
 * Load the date-fns locale to hand to react-day-picker
 *
 * @param locale - The locale the app currently renders in
 * @returns The matching date-fns locale
 * @category i18n
 * @module loadDateFnsLocale
 *
 * @example
 * ```tsx
 * const [calendarLocale, setCalendarLocale] = useState<Locale>();
 * useEffect(() => {
 *   loadDateFnsLocale(locale).then(setCalendarLocale);
 * }, [locale]);
 * ```
 */
export const loadDateFnsLocale = (locale: SupportedLocale): Promise<Locale> =>
  DATE_FNS_LOCALES[locale]();
