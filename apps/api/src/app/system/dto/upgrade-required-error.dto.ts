import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ApiErrorDto } from '../../../common/dto/api-error.dto';

@ApiSchema({ name: 'UpgradeRequiredError' })
export class UpgradeRequiredErrorDto extends ApiErrorDto {
  static readonly httpStatus = 426;
  static readonly errorName = 'Upgrade Required';

  @ApiProperty({ enum: ['UPGRADE_REQUIRED'] })
  code!: 'UPGRADE_REQUIRED';

  @ApiProperty({
    example: '1.6.0',
    description: 'The minimum app version the client must update to before retrying.',
  })
  minVersion!: string;
}
