import { Module } from '@nestjs/common';
import { CountersProcessor } from './counters.processor';
import { CountersService } from './counters.service';

@Module({
	providers: [CountersProcessor, CountersService],
})
export class CountersModule {}