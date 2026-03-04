import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'PlaylistPosterUpload' })
export class PlaylistPosterUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The image file to upload (JPEG, PNG, WebP)',
  })
  file: any;
}
