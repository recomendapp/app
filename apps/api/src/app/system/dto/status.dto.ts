import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

@ApiSchema({ name: 'Status' })
export class StatusDto {
  @ApiProperty({ example: false, description: 'Indicate if the system is under maintenance' })
  @Expose()
  @IsBoolean()
  isMaintenance!: boolean;

  @ApiProperty({ example: '1.0.0', description: 'Minimum required version for the mobile app' })
  @Expose()
  @IsString()
  minMobileVersion!: string;
}
