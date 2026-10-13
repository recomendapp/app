import type { SupportedLocale } from '../locales';

export const getDictionary = async (locale: SupportedLocale) => {
  switch (locale) {
    case 'ar-SA':
      return (await import(`../dictionaries/ar-SA.json`)).default;
    case 'bg-BG':
      return (await import(`../dictionaries/bg-BG.json`)).default;
    case 'ca-ES':
      return (await import(`../dictionaries/ca-ES.json`)).default;
    case 'cs-CZ':
      return (await import(`../dictionaries/cs-CZ.json`)).default;
    case 'da-DK':
      return (await import(`../dictionaries/da-DK.json`)).default;
    case 'de-DE':
      return (await import(`../dictionaries/de-DE.json`)).default;
    case 'el-GR':
      return (await import(`../dictionaries/el-GR.json`)).default;
    case 'es-ES':
      return (await import(`../dictionaries/es-ES.json`)).default;
    case 'es-MX':
      return (await import(`../dictionaries/es-MX.json`)).default;
    case 'et-EE':
      return (await import(`../dictionaries/et-EE.json`)).default;
    case 'fa-IR':
      return (await import(`../dictionaries/fa-IR.json`)).default;
    case 'fi-FI':
      return (await import(`../dictionaries/fi-FI.json`)).default;
    case 'fr-CA':
      return (await import(`../dictionaries/fr-CA.json`)).default;
    case 'fr-FR':
      return (await import(`../dictionaries/fr-FR.json`)).default;
    case 'he-IL':
      return (await import(`../dictionaries/he-IL.json`)).default;
    case 'hi-IN':
      return (await import(`../dictionaries/hi-IN.json`)).default;
    case 'hr-HR':
      return (await import(`../dictionaries/hr-HR.json`)).default;
    case 'hu-HU':
      return (await import(`../dictionaries/hu-HU.json`)).default;
    case 'it-IT':
      return (await import(`../dictionaries/it-IT.json`)).default;
    case 'ja-JP':
      return (await import(`../dictionaries/ja-JP.json`)).default;
    case 'ka-GE':
      return (await import(`../dictionaries/ka-GE.json`)).default;
    case 'ko-KR':
      return (await import(`../dictionaries/ko-KR.json`)).default;
    case 'lt-LT':
      return (await import(`../dictionaries/lt-LT.json`)).default;
    case 'lv-LV':
      return (await import(`../dictionaries/lv-LV.json`)).default;
    case 'nl-NL':
      return (await import(`../dictionaries/nl-NL.json`)).default;
    case 'no-NO':
      return (await import(`../dictionaries/no-NO.json`)).default;
    case 'pl-PL':
      return (await import(`../dictionaries/pl-PL.json`)).default;
    case 'pt-BR':
      return (await import(`../dictionaries/pt-BR.json`)).default;
    case 'pt-PT':
      return (await import(`../dictionaries/pt-PT.json`)).default;
    case 'ro-RO':
      return (await import(`../dictionaries/ro-RO.json`)).default;
    case 'ru-RU':
      return (await import(`../dictionaries/ru-RU.json`)).default;
    case 'sk-SK':
      return (await import(`../dictionaries/sk-SK.json`)).default;
    case 'sl-SI':
      return (await import(`../dictionaries/sl-SI.json`)).default;
    case 'sr-RS':
      return (await import(`../dictionaries/sr-RS.json`)).default;
    case 'sv-SE':
      return (await import(`../dictionaries/sv-SE.json`)).default;
    case 'th-TH':
      return (await import(`../dictionaries/th-TH.json`)).default;
    case 'tr-TR':
      return (await import(`../dictionaries/tr-TR.json`)).default;
    case 'uk-UA':
      return (await import(`../dictionaries/uk-UA.json`)).default;
    case 'vi-VN':
      return (await import(`../dictionaries/vi-VN.json`)).default;
    case 'zh-CN':
      return (await import(`../dictionaries/zh-CN.json`)).default;
    case 'zh-HK':
      return (await import(`../dictionaries/zh-HK.json`)).default;
    case 'zh-TW':
      return (await import(`../dictionaries/zh-TW.json`)).default;
    case 'en-US':
    default:
      return (await import(`../dictionaries/en-US.json`)).default;
  }
};
