import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateEvidenceDto {
  @ApiProperty({ 
    description: 'Nome da pessoa que coletou a evidência',
    example: 'João Silva'
  })
  @IsString()
  @IsNotEmpty()
  collectedBy: string;

  @ApiProperty({ 
    description: 'Data e hora da coleta da evidência',
    example: '2024-01-15T10:30:00Z'
  })
  @IsDateString()
  collectedAt: string;

  @ApiProperty({ 
    description: 'Informações adicionais sobre a coleta',
    example: 'Evidência coletada durante investigação X',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}