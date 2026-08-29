import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProviderDto } from '../../providers/dto/providers.dto';

@ApiSchema({ name: 'ImportSource' })
export class ImportSourceDto {
  @ApiProperty({ type: () => ProviderDto })
  @Expose()
  @Type(() => ProviderDto)
  provider!: ProviderDto;

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
