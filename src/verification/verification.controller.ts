import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import {
  VerificationResponseDto,
  QuickVerificationResponseDto,
} from './dto/verification-response.dto';
import { BaseResponseDto, ErrorResponseDto } from '../common/dto/base.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('verification')
@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post(':id/complete')
  @Roles(Role.SUPER, Role.ADMIN)
  @ApiOperation({
    summary: 'Verificação completa de evidência (SUPER e ADMIN)',
    description: 'Realiza verificação completa incluindo hash, assinatura, timestamp e cadeia de custódia',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da evidência',
    example: 'clp123abc456def789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verificação completa realizada com sucesso',
    type: VerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidência não encontrada',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
    type: ErrorResponseDto,
  })
  async performCompleteVerification(@Param('id') id: string): Promise<VerificationResponseDto> {
    try {
      const verification = await this.verificationService.performCompleteVerification(id);
      
      return {
        success: true,
        message: 'Verificação completa realizada com sucesso',
        data: verification,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/quick')
  @Roles(Role.SUPER, Role.ADMIN)
  @ApiOperation({
    summary: 'Verificação rápida de integridade (SUPER e ADMIN)',
    description: 'Verifica apenas a integridade do hash do arquivo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da evidência',
    example: 'clp123abc456def789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verificação rápida realizada com sucesso',
    type: QuickVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidência não encontrada',
    type: ErrorResponseDto,
  })
  async performQuickVerification(@Param('id') id: string): Promise<QuickVerificationResponseDto> {
    try {
      const verification = await this.verificationService.performQuickVerification(id);
      
      return {
        success: true,
        message: 'Verificação rápida realizada com sucesso',
        data: verification,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('file/verify')
  @Roles(Role.SUPER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Verificar arquivo contra evidência existente (SUPER e ADMIN)',
    description: 'Compara um arquivo enviado com uma evidência já registrada',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verificação de arquivo realizada',
    type: QuickVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Arquivo não fornecido',
    type: ErrorResponseDto,
  })
  async verifyFileAgainstEvidence(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<QuickVerificationResponseDto> {
    try {
      if (!file) {
        throw new Error('Arquivo não fornecido');
      }

      const verification = await this.verificationService.verifyFileAgainstEvidence(file);
      
      return {
        success: true,
        message: 'Verificação de arquivo realizada com sucesso',
        data: verification,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/status')
  @Roles(Role.SUPER, Role.ADMIN)
  @ApiOperation({
    summary: 'Status de verificação da evidência (SUPER e ADMIN)',
    description: 'Retorna informações sobre o status atual da evidência para verificação',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da evidência',
    example: 'clp123abc456def789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status da evidência obtido com sucesso',
  })
  async getVerificationStatus(@Param('id') id: string) {
    try {
      // Implementação básica do status
      const quickVerification = await this.verificationService.performQuickVerification(id);
      
      return {
        success: true,
        message: 'Status da evidência obtido com sucesso',
        data: {
          evidenceId: id,
          isIntact: quickVerification.isIntact,
          lastVerified: new Date().toISOString(),
          status: quickVerification.isIntact ? 'VALID' : 'COMPROMISED',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }
}