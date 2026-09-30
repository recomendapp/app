import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, Matches } from 'class-validator';
import { APP_PLATFORMS, APP_VERSION_RULES, type AppPlatform } from '@libs/rules';

const VERSION_REGEX = new RegExp(APP_VERSION_RULES.VERSION_PATTERN);

export class UpdateVersionPolicyDto {
  @ApiProperty({ enum: APP_PLATFORMS })
  @IsIn(APP_PLATFORMS)
  platform!: AppPlatform;

  @ApiProperty({
    example: '1.7.0',
    description: 'The version that was just submitted for `platform` (not necessarily live yet).',
  })
  @Matches(VERSION_REGEX)
  version!: string;

  @ApiProperty({
    description:
      'Whether this release is backwards-incompatible for API callers (a release-please MAJOR ' +
      'bump). Once the store confirms this version is live, `minVersion` is raised to it too, ' +
      'forcing older installs to update. When false, only `latestVersion` moves -- a soft nudge, ' +
      "nobody's blocked.",
  })
  @IsBoolean()
  isBreaking!: boolean;
}
