import { Module } from '@nestjs/common';
import { CountersProcessor } from './counters.processor';
import { CountersService } from './counters.service';
import { TypesenseModule } from '../../common/modules/typesense.module';

@Module({
	imports: [TypesenseModule],
	providers: [CountersProcessor, CountersService],
})
export class CountersModule {}