import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { PersonDto } from 'src/common/dto/person.dto';
import { Type } from 'class-transformer';

export class SearchPersonsResponseDto extends PaginatedResponseDto<PersonDto> {
  @ApiProperty({ type: [PersonDto] })
  @Type(() => PersonDto)
  declare data: PersonDto[];

  constructor(partial: Partial<SearchPersonsResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
