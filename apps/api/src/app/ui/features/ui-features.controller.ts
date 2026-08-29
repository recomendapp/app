import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { UiFeaturesService } from './ui-features.service';
import { UiFeatureDto } from './ui-features.dto';

@ApiTags('UI')
@Controller({
  path: 'ui/features',
  version: '1',
})
export class UiFeaturesController {
  constructor(private readonly uiFeaturesService: UiFeaturesService) {}

  @Get()
  @ApiOkResponse({ description: 'Get the list of showcased app features', type: [UiFeatureDto] })
  listAll(@CurrentLocale() locale: SupportedLocale): UiFeatureDto[] {
    return this.uiFeaturesService.listAll(locale);
  }
}
