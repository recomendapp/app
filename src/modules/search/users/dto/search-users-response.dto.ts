import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { ProfileDto } from 'src/common/dto/profile.dto';

@Exclude()
export class SearchUsersResponseDto extends PaginatedResponseDto<ProfileDto> {
  @ApiProperty({ type: [ProfileDto] })
  @Type(() => ProfileDto)
  declare data: ProfileDto[];

  constructor(partial: Partial<SearchUsersResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
