import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { TvSeriesDto } from '../dto/tv-series.dto';

/** See `MovieMetadataAlternateDto` -- same reasoning, picked from `TvSeriesDto`. */
@ApiSchema({ name: 'TvSeriesMetadataAlternate' })
export class TvSeriesMetadataAlternateDto extends PickType(TvSeriesDto, ['slug', 'path'] as const) {
  @ApiProperty({ example: 'fr-FR' })
  @Expose()
  @IsString()
  locale!: string;
}

@ApiSchema({ name: 'TvSeriesMetadata' })
export class TvSeriesMetadataDto {
  /**
   * One entry per locale genuinely translating this series, with the path that locale
   * serves it at. Season pages reuse this set with `/season/N` appended: their title and
   * description come from the series name plus a UI string, and their URL embeds the
   * series slug, so they have no translations of their own to report.
   */
  @ApiProperty({ type: [TvSeriesMetadataAlternateDto] })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => TvSeriesMetadataAlternateDto)
  alternates!: TvSeriesMetadataAlternateDto[];
}
