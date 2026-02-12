import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

@ApiSchema({ name: 'Genre' })
export class GenreDto {
  @ApiProperty({
	description: "The genre's ID",
	example: 28,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
	description: 'The name of the genre',
	example: 'Action',
  })
  @Expose()
  @IsString()
  name: string;
}
