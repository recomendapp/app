import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'Status' })
export class StatusDto {
  @ApiProperty({ example: false, description: 'Indicate if the system is under maintenance' })
  isMaintenance: boolean;

  @ApiProperty({ example: '1.0.0', description: 'Minimum required version for the mobile app' })
  minMobileVersion: string;
}