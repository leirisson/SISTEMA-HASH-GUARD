import { Module } from '@nestjs/common';
import { TimestampService } from './timestamp.service';

@Module({
  providers: [TimestampService],
  exports: [TimestampService],
})
export class TimestampModule {}