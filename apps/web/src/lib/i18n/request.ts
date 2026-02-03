import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import deepmerge from 'deepmerge';
import { SupportedLocale, getFallbackLocale, getDictionary } from '@libs/i18n';

const loadMessagesRecursive = async (locale: SupportedLocale): Promise<Record<string, any>> => {
  const fallback = getFallbackLocale({ locale });

  const userMessages = await getDictionary(locale);

  if (!fallback || fallback === locale) {
    return userMessages;
  }

  const fallbackMessages = await loadMessagesRecursive(fallback);
  return deepmerge(fallbackMessages, userMessages);
};


export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale as SupportedLocale;

  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  const messages = await loadMessagesRecursive(locale);

  return {
    locale,
    messages: messages,
  };
});