import { HttpException } from '@nestjs/common';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ApiError' })
export class ApiErrorDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Movie with id 1 not found' })
  message: string | string[];
}

export type ApiErrorDtoClass<T extends ApiErrorDto> = (new () => T) & {
  httpStatus: number;
  errorName: string;
};

export function apiException<T extends ApiErrorDto>(
  ErrorDto: ApiErrorDtoClass<T>,
  payload: Omit<T, 'statusCode' | 'error'>,
): HttpException {
  return new HttpException(
    { statusCode: ErrorDto.httpStatus, error: ErrorDto.errorName, ...payload },
    ErrorDto.httpStatus,
  );
}
