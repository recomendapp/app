import { ApiProperty } from '@nestjs/swagger';
import { IsIn, Matches } from 'class-validator';
import { APP_PLATFORMS, APP_VERSION_RULES, type AppPlatform } from '@libs/rules';

const VERSION_REGEX = new RegExp(APP_VERSION_RULES.VERSION_PATTERN);

export class VersionReleaseRefDto {
  @ApiProperty({ enum: APP_PLATFORMS })
  @IsIn(APP_PLATFORMS)
  platform!: AppPlatform;

  @ApiProperty({ example: '1.7.0' })
  @Matches(VERSION_REGEX)
  version!: string;
}
