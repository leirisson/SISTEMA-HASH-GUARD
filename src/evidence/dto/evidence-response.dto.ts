import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base.dto';

export class EvidenceDto {
  @ApiProperty({ description: 'ID único da evidência' })
  id: string;

  @ApiProperty({ description: 'Nome original do arquivo' })
  filename: string;

  @ApiProperty({ description: 'Caminho do arquivo no sistema' })
  path: string;

  @ApiProperty({ description: 'Hash SHA-256 do arquivo' })
  hash: string;

  @ApiProperty({ description: 'Metadados EXIF do arquivo', required: false })
  exif?: any;

  @ApiProperty({ description: 'Pessoa que coletou a evidência' })
  collectedBy: string;

  @ApiProperty({ description: 'Data e hora da coleta' })
  collectedAt: Date;

  @ApiProperty({ description: 'Arquivo de timestamp', required: false })
  timestampFile?: string;

  @ApiProperty({ description: 'Arquivo de assinatura digital', required: false })
  signatureFile?: string;

  @ApiProperty({ description: 'Chave pública utilizada', required: false })
  publicKey?: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;
}

export class EvidenceResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Dados da evidência', type: EvidenceDto })
  data: EvidenceDto;

  constructor(evidence: EvidenceDto, message: string = 'Evidência processada com sucesso') {
    super(true, message);
    this.data = evidence;
  }
}

export class EvidenceListResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Lista de evidências', type: [EvidenceDto] })
  data: EvidenceDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  constructor(evidences: EvidenceDto[], total: number, message: string = 'Evidências recuperadas com sucesso') {
    super(true, message);
    this.data = evidences;
    this.total = total;
  }
}