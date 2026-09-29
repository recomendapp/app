import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';

@ApiSchema({ name: 'VersionReleaseState' })
export class VersionReleaseStateDto {
  @ApiProperty({
    enum: ['pending', 'live', 'superseded'],
    description:
      'pending: still being checked against the store. live: confirmed available, enforced. ' +
      'superseded: a later version of the same platform is already live -- stop watching this one.',
  })
  @Expose()
  @IsIn(['pending', 'live', 'superseded'])
  state!: 'pending' | 'live' | 'superseded';

  @ApiProperty({ description: 'When this version was first reported, for the watch timeout.' })
  @Expose()
  @IsString()
  createdAt!: string;
}
