import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { PersonDto } from '../dto/persons.dto';

/**
 * Unlike movies and series, `slug` and `path` are the same in every locale here:
 * `person_translation` carries only `biography`, so a person's name is never translated
 * and `PersonDto` builds both from `name` alone. They are still returned per entry so
 * callers can treat all three metadata endpoints identically.
 */
@ApiSchema({ name: 'PersonMetadataAlternate' })
export class PersonMetadataAlternateDto extends PickType(PersonDto, ['slug', 'path'] as const) {
  @ApiProperty({ example: 'fr-FR' })
  @Expose()
  @IsString()
  locale!: string;
}

@ApiSchema({ name: 'PersonMetadata' })
export class PersonMetadataDto {
  /** One entry per locale with a translated biography -- the page's hreflang set. */
  @ApiProperty({ type: [PersonMetadataAlternateDto] })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PersonMetadataAlternateDto)
  alternates!: PersonMetadataAlternateDto[];
}
