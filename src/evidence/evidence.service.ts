import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HashService } from '../hash/hash.service';
import { MetadataService } from '../metadata/metadata.service';
import { CustodyService } from '../custody/custody.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { EvidenceDto } from './dto/evidence-response.dto';
import { existsSync } from 'fs';
import { Express } from 'express';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly metadataService: MetadataService,
    private readonly custodyService: CustodyService,
  ) {}

  /**
   * Cria uma nova evidência com upload de arquivo
   */
  async createEvidence(
    file: any,
    createEvidenceDto: CreateEvidenceDto,
    collectedById?: string,
  ): Promise<EvidenceDto> {
    try {
      // Debug: Log informações do arquivo recebido
      console.log('🔍 DEBUG - Arquivo recebido:', {
        originalname: file?.originalname,
        filename: file?.filename,
        path: file?.path,
        size: file?.size,
        mimetype: file?.mimetype,
        fieldname: file?.fieldname,
        destination: file?.destination,
        encoding: file?.encoding
      });

      // Verificar se o arquivo existe
      console.log('🔍 DEBUG - Verificando existência do arquivo:', file.path);
      console.log('🔍 DEBUG - Arquivo existe?', existsSync(file.path));
      
      if (!existsSync(file.path)) {
        console.error('❌ DEBUG - Arquivo não encontrado no caminho:', file.path);
        throw new BadRequestException('Arquivo não encontrado após upload');
      }

      // Calcular hash do arquivo
      const fileHash = await this.hashService.calculateFileHash(file.path);

      // Verificar se já existe evidência com este hash
      const existingEvidence = await this.prisma.evidence.findUnique({
        where: { hash: fileHash },
      });

      if (existingEvidence) {
        throw new BadRequestException('Evidência com este hash já existe no sistema');
      }

      // Extrair metadados EXIF
      let exifData = null;
      try {
        exifData = await this.metadataService.extractMetadata(file.path);
      } catch (error) {
        console.warn('Não foi possível extrair metadados EXIF:', error.message);
      }

      // Criar registro da evidência
      const evidence = await this.prisma.evidence.create({
        data: {
          filename: file.originalname,
          path: file.path,
          hash: fileHash,
          exif: exifData,
          collectedBy: collectedById || createEvidenceDto.collectedBy,
          collectedAt: new Date(createEvidenceDto.collectedAt),
        },
      });

      // Registrar na cadeia de custódia
      await this.custodyService.logAction(
        evidence.id,
        'UPLOAD',
        collectedById || createEvidenceDto.collectedBy,
        {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          description: createEvidenceDto.description,
        },
      );

      return evidence;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca evidência por ID
   */
  async findById(id: string): Promise<EvidenceDto> {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        custodyLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    return evidence;
  }

  /**
   * Busca evidência por hash
   */
  async findByHash(hash: string): Promise<EvidenceDto> {
    if (!this.hashService.isValidSHA256(hash)) {
      throw new BadRequestException('Hash SHA-256 inválido');
    }

    const evidence = await this.prisma.evidence.findUnique({
      where: { hash },
      include: {
        custodyLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada para este hash');
    }

    return evidence;
  }

  /**
   * Lista todas as evidências
   */
  async findAll(page: number = 1, limit: number = 10): Promise<{ evidences: EvidenceDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [evidences, total] = await Promise.all([
      this.prisma.evidence.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          custodyLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Apenas o último log para performance
          },
        },
      }),
      this.prisma.evidence.count(),
    ]);

    return { evidences, total };
  }

  /**
   * Verifica integridade do arquivo comparando com hash armazenado
   */
  async verifyIntegrity(id: string): Promise<{ isValid: boolean; currentHash: string; storedHash: string }> {
    const evidence = await this.findById(id);

    if (!existsSync(evidence.path)) {
      throw new NotFoundException('Arquivo físico não encontrado');
    }

    const currentHash = await this.hashService.calculateFileHash(evidence.path);
    const isValid = this.hashService.verifyHash(currentHash, evidence.hash);

    // Registrar verificação na cadeia de custódia
    await this.custodyService.logAction(
      evidence.id,
      'INTEGRITY_CHECK',
      'SYSTEM',
      {
        isValid,
        currentHash,
        storedHash: evidence.hash,
      },
    );

    return {
      isValid,
      currentHash,
      storedHash: evidence.hash,
    };
  }
}