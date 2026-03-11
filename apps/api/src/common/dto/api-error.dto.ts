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