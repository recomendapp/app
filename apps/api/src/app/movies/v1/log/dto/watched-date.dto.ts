import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsDate, IsDateString, IsInt, IsNotEmpty } from 'class-validator';

/* -------------------------------- REQUESTS -------------------------------- */

@ApiSchema({ name: 'CreateWatchedDateRequest' })
export class CreateWatchedDateRequestDto {
  @ApiProperty({ example: '2023-10-27T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  date!: string;
}

@ApiSchema({ name: 'UpdateWatchedDateRequest' })
export class UpdateWatchedDateRequestDto {
  @ApiProperty({ example: '2023-10-27T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  date!: string;
}

/* -------------------------------- RESPONSES ------------------------------- */

@ApiSchema({ name: 'WatchedDate' })
@Exclude()
export class WatchedDateDto {
  @ApiProperty({ example: 123, description: 'The unique ID of this history entry' })
  @Expose()
  @IsInt()
  id!: number;

  @Expose()
  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  @IsDate()
  watchedDate!: Date;

  constructor(partial: Partial<WatchedDateDto>) {
    Object.assign(this, partial);
  }
}