import { ClassConstructor, ClassTransformOptions, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError, ValidatorOptions } from 'class-validator';

const RESPONSE_VALIDATION_OPTIONS: ValidatorOptions = {
  forbidNonWhitelisted: false,
  forbidUnknownValues: false,
  skipMissingProperties: false,
  skipNullProperties: false,
  skipUndefinedProperties: false,
  validationError: {
    target: false,
    value: false,
  },
  whitelist: false,
};

const SWAGGER_MODEL_PROPERTY_METADATA = 'swagger/apiModelProperties';

type SwaggerPropertyMetadata = {
  nullable?: boolean;
  required?: boolean;
};

export class ResponseDtoValidationError extends Error {
  constructor(readonly errors: ValidationError[]) {
    super(`Response does not match its DTO: ${formatValidationErrors(errors).join('; ')}`);
    this.name = 'ResponseDtoValidationError';
  }
}

function formatValidationErrors(errors: ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const constraints = Object.values(error.constraints ?? {}).map(
      (constraint) => `${path}: ${constraint}`,
    );
    return [...constraints, ...formatValidationErrors(error.children ?? [], path)];
  });
}

function filterDocumentedAbsences(errors: ValidationError[], value: object): ValidationError[] {
  return errors.flatMap((error) => {
    const propertyValue = Reflect.get(value, error.property) as unknown;
    const metadata = Reflect.getMetadata(
      SWAGGER_MODEL_PROPERTY_METADATA,
      Object.getPrototypeOf(value),
      error.property,
    ) as SwaggerPropertyMetadata | undefined;

    if (
      (propertyValue === null && metadata?.nullable === true) ||
      (propertyValue === undefined && metadata?.required === false)
    ) {
      return [];
    }

    const children = error.children?.length
      ? filterDocumentedAbsences(error.children, propertyValue as object)
      : [];

    return error.constraints || children.length > 0 ? [{ ...error, children }] : [];
  });
}

/**
 * Builds an API response DTO and verifies its runtime contract.
 *
 * The DTO projection happens first, so private database-only fields never leak
 * into the response. The projected response is then validated for missing or
 * invalid documented properties.
 */
export function parseResponseDto<T>(
  dto: ClassConstructor<T>,
  value: object[],
  options?: ClassTransformOptions,
): T[];
export function parseResponseDto<T>(
  dto: ClassConstructor<T>,
  value: object,
  options?: ClassTransformOptions,
): T;
export function parseResponseDto<T>(
  dto: ClassConstructor<T>,
  value: object | object[],
  options?: ClassTransformOptions,
): T | T[] {
  const instance = plainToInstance(dto, value, {
    ...options,
    excludeExtraneousValues: true,
  });
  const values = Array.isArray(instance) ? instance : [instance];
  const errors = values.flatMap((item) =>
    filterDocumentedAbsences(validateSync(item, RESPONSE_VALIDATION_OPTIONS), item),
  );

  if (errors.length > 0) {
    throw new ResponseDtoValidationError(errors);
  }

  return instance;
}
