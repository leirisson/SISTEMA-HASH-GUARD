import { Controller, Get, Param, Query, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CustodyService } from './custody.service';
import { BaseResponseDto, ErrorResponseDto } from '../common/dto/base.dto';
import {
  CustodyChainResponseDto,
  CustodyValidationResponseDto,
  CustodyReportResponseDto,
} from './dto/custody-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('custody')
@Controller('custody')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustodyController {
  constructor(private readonly custodyService: CustodyService) {}

  @Get('evidence/:evidenceId')
  @Roles(Role.USER, Role.SUPER, Role.ADMIN)
  @ApiOperation({ summary: 'Recuperar cadeia de custódia de uma evidência' })
  @ApiParam({ name: 'evidenceId', description: 'ID da evidência' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cadeia de custódia obtida com sucesso',
    type: CustodyChainResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidência não encontrada',
    type: ErrorResponseDto,
  })
  async getCustodyChain(@Param('evidenceId') evidenceId: string): Promise<CustodyChainResponseDto> {
    const custodyChain = await this.custodyService.getCustodyChain(evidenceId);
    
    const actors = [...new Set(custodyChain.map(log => log.actor))];
    const firstEntry = custodyChain.length > 0 ? custodyChain[0].createdAt.toISOString() : null;
    const lastEntry = custodyChain.length > 0 ? custodyChain[custodyChain.length - 1].createdAt.toISOString() : null;

    return {
      success: true,
      message: 'Cadeia de custódia obtida com sucesso',
      data: {
        evidenceId,
        logs: custodyChain,
        totalEntries: custodyChain.length,
        firstEntry,
        lastEntry,
        actors,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('evidence/:evidenceId/report')
  @Roles(Role.SUPER, Role.ADMIN)
  @ApiOperation({ summary: 'Gerar relatório completo de custódia (apenas SUPER e ADMIN)' })
  @ApiParam({ name: 'evidenceId', description: 'ID da evidência' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de custódia gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            evidence: { type: 'object' },
            custodyChain: { type: 'array' },
            summary: {
              type: 'object',
              properties: {
                totalActions: { type: 'number' },
                firstAction: { type: 'string', format: 'date-time' },
                lastAction: { type: 'string', format: 'date-time' },
                actors: { type: 'array', items: { type: 'string' } },
                actions: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  })
  async generateCustodyReport(@Param('evidenceId', ParseUUIDPipe) evidenceId: string) {
    const report = await this.custodyService.generateCustodyReport(evidenceId);
    
    return {
      success: true,
      message: 'Relatório de custódia gerado com sucesso',
      timestamp: new Date().toISOString(),
      data: report,
    };
  }

  @Get('evidence/:evidenceId/validate')
  @Roles(Role.USER, Role.SUPER, Role.ADMIN)
  @ApiOperation({ summary: 'Validar integridade da cadeia de custódia' })
  @ApiParam({ name: 'evidenceId', description: 'ID da evidência' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validação da cadeia de custódia realizada',
    type: CustodyValidationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidência não encontrada',
    type: ErrorResponseDto,
  })
  async validateCustodyChain(@Param('evidenceId') evidenceId: string): Promise<CustodyValidationResponseDto> {
    const validation = await this.custodyService.validateCustodyChain(evidenceId);
    
    return {
      success: true,
      message: 'Validação da cadeia de custódia concluída',
      timestamp: new Date().toISOString(),
      data: validation,
    };
  }

  @Get('actor/:actor')
  @ApiOperation({ summary: 'Recuperar logs de custódia por ator' })
  @ApiParam({ name: 'actor', description: 'Nome do ator' })
  @ApiResponse({
    status: 200,
    description: 'Logs do ator recuperados com sucesso',
  })
  async getLogsByActor(@Param('actor') actor: string) {
    const logs = await this.custodyService.getLogsByActor(actor);
    
    return {
      success: true,
      message: 'Logs do ator recuperados com sucesso',
      timestamp: new Date().toISOString(),
      data: logs,
    };
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Recuperar logs de custódia por tipo de ação' })
  @ApiParam({ name: 'action', description: 'Tipo de ação' })
  @ApiResponse({
    status: 200,
    description: 'Logs da ação recuperados com sucesso',
  })
  async getLogsByAction(@Param('action') action: string) {
    const logs = await this.custodyService.getLogsByAction(action);
    
    return {
      success: true,
      message: 'Logs da ação recuperados com sucesso',
      timestamp: new Date().toISOString(),
      data: logs,
    };
  }
}