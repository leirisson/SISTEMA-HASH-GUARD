import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { HashModule } from '../hash/hash.module';
import { SignatureModule } from '../signature/signature.module';
import { TimestampModule } from '../timestamp/timestamp.module';
import { CustodyModule } from '../custody/custody.module';

@Module({
  imports: [HashModule, SignatureModule, TimestampModule, CustodyModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}