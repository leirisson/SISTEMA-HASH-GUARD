import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import {
  EvidenceResponseDto,
  EvidenceListResponseDto,
} from './dto/evidence-response.dto';
import { BaseResponseDto, ErrorResponseDto } from '../common/dto/base.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('evidence')
@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload')
  @Roles(Role.USER, Role.SUPER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: process.env.UPLOAD_PATH || './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
    },
  }))
  @ApiOperation({ summary: 'Upload de evidência digital' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de evidência (foto, vídeo, documento)',
        },
        collectedBy: {
          type: 'string',
          description: 'Nome da pessoa que coletou a evidência',
        },
        collectedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Data e hora da coleta',
        },
        description: {
          type: 'string',
          description: 'Descrição adicional (opcional)',
        },
      },
      required: ['file', 'collectedBy', 'collectedAt'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Evidência criada com sucesso',
    type: EvidenceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Arquivo inválido ou dados incorretos',
    type: ErrorResponseDto,
  })
  async uploadEvidence(
    @UploadedFile() file: Express.Multer.File,
    @Body() createEvidenceDto: CreateEvidenceDto,
    @CurrentUser() currentUser: User,
  ): Promise<EvidenceResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const evidence = await this.evidenceService.createEvidence(file, createEvidenceDto, currentUser.id);
    return new EvidenceResponseDto(evidence, 'Evidência criada com sucesso');
  }

  @Get()
  @Roles(Role.USER, Role.SUPER, Role.ADMIN)
  @ApiOperation({ summary: 'Listar evidências' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de evidências',
    type: EvidenceListResponseDto,
  })
  async findAll(
    @CurrentUser() currentUser: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<EvidenceListResponseDto> {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Parâmetros de paginação inválidos');
    }

    const { evidences, total } = await this.evidenceService.findAll(pageNum, limitNum);
    return new EvidenceListResponseDto(evidences, total);
  }

  @Get('id/:id')
  @Roles(Role.USER, Role.SUPER, Role.ADMIN)
  @ApiOperation({ summary: 'Buscar evidência por ID' })
  @ApiParam({ name: 'id', description: 'ID único da evidência' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidência encontrada',
    type: EvidenceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidência não encontrada',
    type: ErrorResponseDto,
  })
  async findById(@Param('id') id: string): Promise<EvidenceResponseDto> {
    const evidence = await this.evidenceService.findById(id);
    return new EvidenceResponseDto(evidence, 'Evidência encontrada');
  }

  @Get('hash/:hash')
  @Roles(Role.USER, Role.SUPER, Role.ADMIN)
  @ApiOperation({ summary: 'Buscar evidência por hash' })
  @ApiParam({ name: 'hash', description: 'Hash SHA-256 da evidência' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidência encontrada',
    type: EvidenceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidência não encontrada',
    type: ErrorResponseDto,
  })
  async findByHash(@Param('hash') hash: string): Promise<EvidenceResponseDto> {
    const evidence = await this.evidenceService.findByHash(hash);
    return new EvidenceResponseDto(evidence, 'Evidência encontrada');
  }

  @Get(':id/verify')
  @ApiOperation({ summary: 'Verificar integridade da evidência' })
  @ApiParam({ name: 'id', description: 'ID único da evidência' })
  @ApiResponse({
    status: 200,
    description: 'Verificação de integridade realizada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            currentHash: { type: 'string' },
            storedHash: { type: 'string' },
          },
        },
      },
    },
  })
  async verifyIntegrity(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.evidenceService.verifyIntegrity(id);
    return new BaseResponseDto(true, 'Verificação de integridade concluída').constructor.call({
      success: true,
      message: 'Verificação de integridade concluída',
      timestamp: new Date().toISOString(),
      data: result,
    });
  }
}