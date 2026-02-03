import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { Profile } from '../../../common/dto/profile.dto';

@Exclude()
export class SearchUsersResponse extends PaginatedResponseDto<Profile> {
  @ApiProperty({ type: [Profile] })
  @Type(() => Profile)
  declare data: Profile[];

  constructor(partial: Partial<SearchUsersResponse>) {
    super(partial);
    Object.assign(this, partial);
  }
}
