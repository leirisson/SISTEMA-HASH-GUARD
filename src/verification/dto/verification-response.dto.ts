import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base.dto';

export class HashVerificationDto {
  @ApiProperty({ description: 'Se o hash está íntegro' })
  isValid: boolean;

  @ApiProperty({ description: 'Hash armazenado no banco' })
  storedHash: string;

  @ApiProperty({ description: 'Hash calculado do arquivo atual' })
  calculatedHash: string;

  @ApiProperty({ description: 'Mensagem de verificação', required: false })
  message?: string;
}

export class SignatureVerificationDto {
  @ApiProperty({ description: 'Se a assinatura é válida' })
  isValid: boolean;

  @ApiProperty({ description: 'Informações da chave pública', required: false })
  publicKeyInfo?: {
    keyId: string;
    userId: string;
    algorithm: string;
    created: string;
  };

  @ApiProperty({ description: 'Mensagem de verificação', required: false })
  message?: string;

  @ApiProperty({ description: 'Erro na verificação', required: false })
  error?: string;
}

export class TimestampVerificationDto {
  @ApiProperty({ description: 'Se o timestamp é válido' })
  isValid: boolean;

  @ApiProperty({ description: 'Data do timestamp', required: false })
  timestamp?: string;

  @ApiProperty({ description: 'Altura do bloco na blockchain', required: false })
  blockHeight?: number;

  @ApiProperty({ description: 'Fonte do timestamp' })
  source: string;

  @ApiProperty({ description: 'Mensagem de verificação', required: false })
  message?: string;

  @ApiProperty({ description: 'Erro na verificação', required: false })
  error?: string;
}

export class CustodyVerificationDto {
  @ApiProperty({ description: 'Se a cadeia de custódia está íntegra' })
  isValid: boolean;

  @ApiProperty({ description: 'Número total de entradas na cadeia' })
  totalEntries: number;

  @ApiProperty({ description: 'Data da primeira entrada' })
  firstEntry: string;

  @ApiProperty({ description: 'Data da última entrada' })
  lastEntry: string;

  @ApiProperty({ description: 'Lista de atores envolvidos' })
  actors: string[];

  @ApiProperty({ description: 'Problemas encontrados na cadeia', type: [String] })
  issues: string[];
}

export class CompleteVerificationDto {
  @ApiProperty({ description: 'ID da evidência' })
  evidenceId: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  filename: string;

  @ApiProperty({ description: 'Se a verificação geral passou' })
  overallValid: boolean;

  @ApiProperty({ description: 'Pontuação de confiança (0-100)' })
  confidenceScore: number;

  @ApiProperty({ description: 'Verificação de hash' })
  hashVerification: HashVerificationDto;

  @ApiProperty({ description: 'Verificação de assinatura', required: false })
  signatureVerification?: SignatureVerificationDto;

  @ApiProperty({ description: 'Verificação de timestamp', required: false })
  timestampVerification?: TimestampVerificationDto;

  @ApiProperty({ description: 'Verificação de cadeia de custódia' })
  custodyVerification: CustodyVerificationDto;

  @ApiProperty({ description: 'Data da verificação' })
  verifiedAt: string;

  @ApiProperty({ description: 'Resumo da verificação' })
  summary: string;

  @ApiProperty({ description: 'Recomendações', type: [String] })
  recommendations: string[];
}

export class VerificationResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Resultado da verificação completa' })
  data: CompleteVerificationDto;
}

export class QuickVerificationDto {
  @ApiProperty({ description: 'Se o arquivo está íntegro' })
  isIntact: boolean;

  @ApiProperty({ description: 'Hash do arquivo' })
  fileHash: string;

  @ApiProperty({ description: 'Se o hash confere com o armazenado' })
  hashMatches: boolean;

  @ApiProperty({ description: 'Mensagem resumida' })
  message: string;
}

export class QuickVerificationResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Resultado da verificação rápida' })
  data: QuickVerificationDto;
}