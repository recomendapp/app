import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'MeAvatarUpload' })
export class MeAvatarUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The image file to upload (JPEG, PNG, WebP)',
  })
  file: any;
}
