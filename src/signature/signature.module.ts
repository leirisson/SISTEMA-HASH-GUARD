import { Module } from '@nestjs/common';
import { SignatureService } from '../signature/signature.service';

@Module({
  providers: [SignatureService],
  exports: [SignatureService],
})
export class SignatureModule {}