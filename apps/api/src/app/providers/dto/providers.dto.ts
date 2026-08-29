import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { getAssetUrl } from '../../../utils/get-asset-url';

@ApiSchema({ name: 'Provider' })
export class ProviderDto {
  @ApiProperty() @Expose() slug!: string;

  @ApiProperty() @Expose() name!: string;

  @ApiPropertyOptional({ nullable: true }) @Expose() description!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Full URL to the light-theme icon' })
  @Expose()
  @Transform(({ value }) => getAssetUrl(value))
  iconLight!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Full URL to the dark-theme icon' })
  @Expose()
  @Transform(({ value }) => getAssetUrl(value))
  iconDark!: string | null;

  constructor(data: ProviderDto) {
    Object.assign(this, data);
  }
}
