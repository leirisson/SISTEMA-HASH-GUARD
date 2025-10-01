import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem descritiva da operação' })
  message: string;

  @ApiProperty({ description: 'Timestamp da operação' })
  timestamp: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}

export class DataResponseDto<T> extends BaseResponseDto {
  @ApiProperty({ description: 'Dados da resposta' })
  data: T;

  constructor(success: boolean, message: string, data: T) {
    super(success, message);
    this.data = data;
  }
}

export class ErrorResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Código do erro' })
  errorCode?: string;

  @ApiProperty({ description: 'Detalhes adicionais do erro' })
  details?: any;

  constructor(message: string, errorCode?: string, details?: any) {
    super(false, message);
    this.errorCode = errorCode;
    this.details = details;
  }
}