import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum CustodyAction {
  UPLOAD = 'UPLOAD',
  ACCESS = 'ACCESS',
  VERIFICATION = 'VERIFICATION',
  SIGNATURE = 'SIGNATURE',
  TIMESTAMP = 'TIMESTAMP',
  TRANSFER = 'TRANSFER',
  MODIFICATION = 'MODIFICATION',
  DELETION = 'DELETION',
}

export class CreateCustodyLogDto {
  @ApiProperty({ description: 'ID da evidência' })
  @IsString()
  evidenceId: string;

  @ApiProperty({ 
    description: 'Ação realizada',
    enum: CustodyAction,
    example: CustodyAction.UPLOAD,
  })
  @IsEnum(CustodyAction)
  action: CustodyAction;

  @ApiProperty({ description: 'Ator responsável pela ação' })
  @IsString()
  actor: string;

  @ApiProperty({ 
    description: 'Detalhes adicionais da ação',
    required: false,
  })
  @IsOptional()
  @IsString()
  details?: string;
}