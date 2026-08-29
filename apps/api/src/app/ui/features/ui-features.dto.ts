import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { getAssetUrl } from '../../../utils/get-asset-url';

@ApiSchema({ name: 'UiFeatureAsset' })
export class UiFeatureAssetDto {
  @ApiProperty({ description: 'Full URL to the web-facing asset' })
  @Expose()
  @Transform(({ value }) => getAssetUrl(value))
  default!: string;

  @ApiProperty({ description: 'Full URL to the mobile-facing asset' })
  @Expose()
  @Transform(({ value }) => getAssetUrl(value))
  mobile!: string;

  constructor(data: UiFeatureAssetDto) {
    Object.assign(this, data);
  }
}

// Video-only: a WebM/VP9 variant alongside the web mp4 fallback -- posters are plain jpg, no
// format-compatibility concerns there, hence the separate DTO instead of adding webm to the
// shared UiFeatureAssetDto. Mobile never gets a webm source, only `mobile` (AVPlayer/ExoPlayer
// both decode H.264 mp4 natively; WebM isn't supported on iOS at all).
@ApiSchema({ name: 'UiFeatureVideoAsset' })
export class UiFeatureVideoAssetDto extends UiFeatureAssetDto {
  @ApiProperty({
    description:
      'Full URL to the web-facing WebM/VP9 variant, preferred over `default` when supported',
  })
  @Expose()
  @Transform(({ value }) => getAssetUrl(value))
  webm!: string;
}

@ApiSchema({ name: 'UiFeature' })
export class UiFeatureDto {
  @ApiProperty({ example: 'tracking' })
  @Expose()
  key!: string;

  @ApiProperty({ example: 'Tracking' })
  @Expose()
  label!: string;

  @ApiProperty({ example: 'Keep an eye on the films you have seen' })
  @Expose()
  description!: string;

  @ApiProperty({ type: () => UiFeatureVideoAssetDto })
  @Expose()
  @Type(() => UiFeatureVideoAssetDto)
  video!: UiFeatureVideoAssetDto;

  @ApiProperty({ type: () => UiFeatureAssetDto })
  @Expose()
  @Type(() => UiFeatureAssetDto)
  poster!: UiFeatureAssetDto;

  constructor(data: UiFeatureDto) {
    Object.assign(this, data);
  }
}
