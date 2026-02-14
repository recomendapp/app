import { Controller, UseGuards, Get, Param, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { PersonFollowDto } from './dto/person-follow.dto';
import { PersonDto } from './dto/persons.dto';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Persons')
@Controller({
  path: 'person',
  version: '1',
})
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get(':person_id')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the person details',
    type: PersonDto,
  })
  async getPerson(
    @Param('person_id', ParseIntPipe) personId: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<PersonDto> {
    return this.personsService.get({
      personId,
      currentUser,
      locale,
    });
  }

  /* --------------------------------- Follows -------------------------------- */

  @Get(':person_id/follow')
  @UseGuards(AuthGuard)
  @ApiExtraModels(PersonFollowDto)
  @ApiOkResponse({
    description: 'Get follow relationship with the target person',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(PersonFollowDto) }
      ]
    }
  })
  async getFollowStatus(
    @Param('person_id', ParseIntPipe) personId: number,
    @CurrentUser() currentUser: User,
  ): Promise<PersonFollowDto | null> {
    return this.personsService.getFollowStatus(currentUser.id, personId);
  }

  @Post(':person_id/follow')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Follow a person',
    type: PersonFollowDto,
  })
  async follow(
    @Param('person_id', ParseIntPipe) personId: number,
    @CurrentUser() currentUser: User,
  ): Promise<PersonFollowDto> {
    return this.personsService.follow(currentUser.id, personId);
  }

  @Delete(':person_id/follow')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unfollow a person',
    type: PersonFollowDto,
  })
  async unfollow(
    @Param('person_id', ParseIntPipe) personId: number,
    @CurrentUser() currentUser: User,
  ): Promise<PersonFollowDto> {
    return this.personsService.unfollow(currentUser.id, personId);
  }
  /* -------------------------------------------------------------------------- */
}