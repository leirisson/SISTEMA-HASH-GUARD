import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto, DataResponseDto } from '../../common/dto/base.dto';

export class CustodyLogDto {
  @ApiProperty({ description: 'ID do log de custódia' })
  id: string;

  @ApiProperty({ description: 'ID da evidência' })
  evidenceId: string;

  @ApiProperty({ description: 'Ação realizada' })
  action: string;

  @ApiProperty({ description: 'Ator responsável pela ação' })
  actor: string;

  @ApiProperty({ description: 'Detalhes adicionais', required: false })
  details?: string;

  @ApiProperty({ description: 'Data da ação' })
  createdAt: Date;
}

export class CustodyChainDto {
  @ApiProperty({ description: 'ID da evidência' })
  evidenceId: string;

  @ApiProperty({ description: 'Lista de logs de custódia', type: [CustodyLogDto] })
  logs: CustodyLogDto[];

  @ApiProperty({ description: 'Número total de entradas' })
  totalEntries: number;

  @ApiProperty({ description: 'Data da primeira entrada' })
  firstEntry: string;

  @ApiProperty({ description: 'Data da última entrada' })
  lastEntry: string;

  @ApiProperty({ description: 'Lista de atores únicos' })
  actors: string[];
}

export class CustodyChainResponseDto extends DataResponseDto<CustodyChainDto> {}

export class CustodyValidationDto {
  @ApiProperty({ description: 'Se a cadeia de custódia é válida' })
  isValid: boolean;

  @ApiProperty({ description: 'Lista de problemas encontrados', type: [String] })
  issues: string[];

  @ApiProperty({ description: 'Número total de entradas verificadas' })
  totalEntries: number;

  @ApiProperty({ description: 'Pontuação de integridade (0-100)' })
  integrityScore: number;

  @ApiProperty({ description: 'Recomendações', type: [String] })
  recommendations: string[];
}

export class CustodyValidationResponseDto extends DataResponseDto<CustodyValidationDto> {}

export class CustodyReportDto {
  @ApiProperty({ description: 'ID da evidência' })
  evidenceId: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  filename: string;

  @ApiProperty({ description: 'Resumo da cadeia de custódia' })
  summary: {
    totalActions: number;
    uniqueActors: number;
    timeSpan: string;
    firstAction: Date;
    lastAction: Date;
  };

  @ApiProperty({ description: 'Histórico detalhado', type: [CustodyLogDto] })
  detailedHistory: CustodyLogDto[];

  @ApiProperty({ description: 'Análise de integridade' })
  integrityAnalysis: CustodyValidationDto;

  @ApiProperty({ description: 'Data de geração do relatório' })
  generatedAt: Date;
}

export class CustodyReportResponseDto extends DataResponseDto<CustodyReportDto> {}