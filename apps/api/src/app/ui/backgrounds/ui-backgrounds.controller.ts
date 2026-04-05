import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { UiBackgroundsService } from './ui-backgrounds.service';
import { 
    ListAllUiBackgroundsQueryDto, 
    UiBackgroundWithMediaUnion, 
    UiBackgroundWithMovieDto, 
    UiBackgroundWithTvSeriesDto 
} from './ui-backgrounds.dto';

@ApiTags('UI')
@ApiExtraModels(UiBackgroundWithMovieDto, UiBackgroundWithTvSeriesDto)
@Controller({
  path: 'ui/backgrounds',
  version: '1',
})
export class UiBackgroundsController {
  constructor(private readonly uiService: UiBackgroundsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Get a list of random UI backgrounds (Movies or TV Series)',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(UiBackgroundWithMovieDto) },
          { $ref: getSchemaPath(UiBackgroundWithTvSeriesDto) },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            movie: getSchemaPath(UiBackgroundWithMovieDto),
            tv_series: getSchemaPath(UiBackgroundWithTvSeriesDto),
          },
        },
      },
    },
  })
  async listAll(
    @Query() query: ListAllUiBackgroundsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<UiBackgroundWithMediaUnion[]> {
    return this.uiService.listAll({
      query,
      locale,
    });
  }
}