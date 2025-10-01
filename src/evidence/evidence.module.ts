import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { HashModule } from '../hash/hash.module';
import { MetadataModule } from '../metadata/metadata.module';
import { CustodyModule } from '../custody/custody.module';

@Module({
  imports: [HashModule, MetadataModule, CustodyModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}