import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../dto/api-error.dto';

export function ApiErrors(...codes: number[]) {
  return applyDecorators(
    ...codes.map(code =>
      ApiResponse({
        status: code,
        type: ApiErrorDto,
      }),
    ),
  );
}