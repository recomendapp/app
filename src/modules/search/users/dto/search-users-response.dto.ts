import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { ProfileDto } from 'src/common/dto/profile.dto';

export class SearchUsersResponseDto extends PaginatedResponseDto<ProfileDto> {
  @ApiProperty({ type: [ProfileDto] })
  declare data: ProfileDto[];
}
