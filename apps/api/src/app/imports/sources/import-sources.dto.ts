import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { importJobDirectionEnum, importJobProviderEnum } from '@libs/db/schemas';
import { getAssetUrl } from '../../../utils/get-asset-url';

@ApiSchema({ name: 'ImportSource' })
export class ImportSourceDto {
  @ApiProperty({ enum: importJobProviderEnum.enumValues })
  @Expose()
  provider!: (typeof importJobProviderEnum.enumValues)[number];

  @ApiProperty({ enum: importJobDirectionEnum.enumValues })
  @Expose()
  direction!: (typeof importJobDirectionEnum.enumValues)[number];

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

  @ApiPropertyOptional({
    nullable: true,
    description: 'Markdown steps for obtaining the export file from this provider',
  })
  @Expose()
  instructions!: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @Expose()
  fileTypes!: string[] | null;

  @ApiProperty() @Expose() enabled!: boolean;

  constructor(data: ImportSourceDto) {
    Object.assign(this, data);
  }
}
