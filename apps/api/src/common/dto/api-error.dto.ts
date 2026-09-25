import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  MethodNotAllowedException,
  NotAcceptableException,
  NotFoundException,
  NotImplementedException,
  PayloadTooLargeException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
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

const EXCEPTION_BY_STATUS: Record<number, new (response: unknown) => HttpException> = {
  400: BadRequestException,
  401: UnauthorizedException,
  403: ForbiddenException,
  404: NotFoundException,
  405: MethodNotAllowedException,
  406: NotAcceptableException,
  408: RequestTimeoutException,
  409: ConflictException,
  410: GoneException,
  413: PayloadTooLargeException,
  415: UnsupportedMediaTypeException,
  422: UnprocessableEntityException,
  501: NotImplementedException,
  503: ServiceUnavailableException,
};

export function apiException<T extends ApiErrorDto>(
  ErrorDto: ApiErrorDtoClass<T>,
  payload: Omit<T, 'statusCode' | 'error'>,
): HttpException {
  const body = { statusCode: ErrorDto.httpStatus, error: ErrorDto.errorName, ...payload };
  const ExceptionClass = EXCEPTION_BY_STATUS[ErrorDto.httpStatus];
  return ExceptionClass ? new ExceptionClass(body) : new HttpException(body, ErrorDto.httpStatus);
}
