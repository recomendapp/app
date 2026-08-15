import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsInt, IsString } from 'class-validator';

@ApiSchema({ name: 'Explore' })
export class ExploreDto {
  @ApiProperty({ example: 1 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'Paris on Screen' })
  @Expose()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'paris-on-screen' })
  @Expose()
  @IsString()
  slug!: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  updatedAt!: string;

  constructor(data: ExploreDto) {
    Object.assign(this, data);
  }
}
