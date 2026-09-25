import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorDto, ApiErrorDtoClass } from '../dto/api-error.dto';

export function ApiErrorResponse<T extends ApiErrorDto>(
  ErrorDto: ApiErrorDtoClass<T>,
  description: string,
) {
  return applyDecorators(
    ApiResponse({
      status: ErrorDto.httpStatus,
      type: ErrorDto,
      description,
    }),
  );
}
