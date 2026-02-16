import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsString, ValidateNested } from 'class-validator';
import { PersonCompactDto } from '../../persons/dto/persons.dto';

@ApiSchema({ name: 'TvSeriesRole' })
export class TvSeriesRoleDto {
  @ApiProperty()
  @Expose()
  @IsString()
  character: string;

  @ApiProperty()
  @Expose()
  @IsInt()
  order: number;
}

@ApiSchema({ name: 'TvSeriesCasting' })
export class TvSeriesCastingDto {
  @ApiProperty()
  @Expose()
  @IsInt()
  tvSeriesId: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  personId: number;

  @ApiProperty({ description: 'The primary ordering index for this actor' })
  @Expose()
  @IsInt()
  order: number;

  @ApiProperty({ type: () => PersonCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => PersonCompactDto)
  person: PersonCompactDto;

  @ApiProperty({ type: () => [TvSeriesRoleDto] })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => TvSeriesRoleDto)
  roles: TvSeriesRoleDto[];
}