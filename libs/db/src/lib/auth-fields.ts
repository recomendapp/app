import { defaultSupportedLocale } from '@libs/i18n';

export const additionalFields = {
  usernameUpdatedAt: {
    type: 'date',
    required: false,
    defaultValue: null,
    input: false,
  },
  language: {
    type: 'string',
    defaultValue: defaultSupportedLocale,
    required: true,
    input: true,
  },
} as const;
