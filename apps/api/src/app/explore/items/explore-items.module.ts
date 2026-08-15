import { forwardRef, Module } from '@nestjs/common';
import { ExploreItemsController } from './explore-items.controller';
import { ExploreItemsService } from './explore-items.service';
import { ExploreModule } from '../explore.module';

@Module({
  imports: [forwardRef(() => ExploreModule)],
  controllers: [ExploreItemsController],
  providers: [ExploreItemsService],
  exports: [ExploreItemsService],
})
export class ExploreItemsModule {}
