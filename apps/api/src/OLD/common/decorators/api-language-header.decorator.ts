import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiLanguageHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'language',
      description: 'The language for the response. Defaults to "en-US".',
      required: false,
      schema: {
        type: 'string',
        default: 'en-US',
      },
    }),
  );
}
