import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

@Exclude()
export class Genre {
  @ApiProperty({ description: "The genre's ID" })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ description: 'The name of the genre' })
  @Expose()
  @IsString()
  name: string;
}
