import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

@ApiSchema({ name: 'AppVersionStatus' })
export class AppVersionStatusDto {
  @ApiProperty({
    enum: ['up_to_date', 'update_available', 'update_required'],
    description:
      'up_to_date: nothing to do. update_available: an update exists but the app still works. ' +
      'update_required: the app must update before it can keep using the API. Always ' +
      "up_to_date (with null versions) when the caller didn't send its app headers.",
  })
  @Expose()
  @IsIn(['up_to_date', 'update_available', 'update_required'])
  status!: 'up_to_date' | 'update_available' | 'update_required';

  @ApiProperty({ example: '1.6.0', nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  minVersion!: string | null;

  @ApiProperty({ example: '1.7.0', nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  latestVersion!: string | null;
}

@ApiSchema({ name: 'Status' })
export class StatusDto {
  @ApiProperty({ example: false, description: 'Indicate if the system is under maintenance' })
  @Expose()
  @IsBoolean()
  isMaintenance!: boolean;

  @ApiProperty({
    type: () => AppVersionStatusDto,
    description:
      "The calling app's own version status (mobile today, potentially web later -- see " +
      'the `x-app-platform`/`x-app-version` headers).',
  })
  @Expose()
  @ValidateNested()
  @Type(() => AppVersionStatusDto)
  version!: AppVersionStatusDto;
}
