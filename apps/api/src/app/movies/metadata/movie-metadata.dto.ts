import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { MovieDto } from '../dto/movies.dto';

@ApiSchema({ name: 'MovieMetadataAlternate' })
export class MovieMetadataAlternateDto extends PickType(MovieDto, ['slug', 'path'] as const) {
  @ApiProperty({ example: 'fr-FR' })
  @Expose()
  @IsString()
  locale!: string;
}

@ApiSchema({ name: 'MovieMetadata' })
export class MovieMetadataDto {
  /**
   * One entry per locale that genuinely translates this movie, each with the path that
   * locale serves it at -- the slug follows the localized title, so it differs per
   * locale. Ready to be emitted as the page's hreflang set.
   */
  @ApiProperty({ type: [MovieMetadataAlternateDto] })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MovieMetadataAlternateDto)
  alternates!: MovieMetadataAlternateDto[];
}
