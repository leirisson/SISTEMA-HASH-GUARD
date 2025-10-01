import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HashService } from '../hash/hash.service';
import { SignatureService } from '../signature/signature.service';
import { TimestampService } from '../timestamp/timestamp.service';
import { CustodyService } from '../custody/custody.service';
import { readFileSync, existsSync } from 'fs';
import {
  CompleteVerificationDto,
  HashVerificationDto,
  SignatureVerificationDto,
  TimestampVerificationDto,
  CustodyVerificationDto,
  QuickVerificationDto,
} from './dto/verification-response.dto';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly signatureService: SignatureService,
    private readonly timestampService: TimestampService,
    private readonly custodyService: CustodyService,
  ) {}

  /**
   * Realiza verificação completa de uma evidência
   * @param evidenceId ID da evidência
   * @returns Resultado completo da verificação
   */
  async performCompleteVerification(evidenceId: string): Promise<CompleteVerificationDto> {
    this.logger.log(`Iniciando verificação completa para evidência: ${evidenceId}`);

    // Buscar evidência
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    // Verificar hash
    const hashVerification = await this.verifyHash(evidence.path, evidence.hash);

    // Verificar assinatura (se existir)
    let signatureVerification: SignatureVerificationDto | undefined;
    if (evidence.signatureFile && evidence.publicKey) {
      signatureVerification = await this.verifySignature(
        evidence.hash,
        evidence.signatureFile,
        evidence.publicKey,
      );
    }

    // Verificar timestamp (se existir)
    let timestampVerification: TimestampVerificationDto | undefined;
    if (evidence.timestampFile) {
      timestampVerification = await this.verifyTimestamp(
        evidence.hash,
        evidence.timestampFile,
      );
    }

    // Verificar cadeia de custódia
    const custodyVerification = await this.verifyCustodyChain(evidenceId);

    // Calcular pontuação de confiança
    const confidenceScore = this.calculateConfidenceScore({
      hashVerification,
      signatureVerification,
      timestampVerification,
      custodyVerification,
    });

    // Determinar se a verificação geral passou
    const overallValid = this.determineOverallValidity({
      hashVerification,
      signatureVerification,
      timestampVerification,
      custodyVerification,
    });

    // Gerar resumo e recomendações
    const { summary, recommendations } = this.generateSummaryAndRecommendations({
      hashVerification,
      signatureVerification,
      timestampVerification,
      custodyVerification,
      overallValid,
      confidenceScore,
    });

    const result: CompleteVerificationDto = {
      evidenceId,
      filename: evidence.filename,
      overallValid,
      confidenceScore,
      hashVerification,
      signatureVerification,
      timestampVerification,
      custodyVerification,
      verifiedAt: new Date().toISOString(),
      summary,
      recommendations,
    };

    // Registrar verificação na cadeia de custódia
    // Usar um usuário do sistema ou o usuário atual se disponível
    await this.custodyService.logAction(evidenceId, 'VERIFICATION', 'SYSTEM', 'Verificação automática de integridade');

    this.logger.log(`Verificação completa finalizada. Resultado: ${overallValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
    return result;
  }

  /**
   * Realiza verificação rápida de integridade
   * @param evidenceId ID da evidência
   * @returns Resultado da verificação rápida
   */
  async performQuickVerification(evidenceId: string): Promise<QuickVerificationDto> {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    const hashVerification = await this.verifyHash(evidence.path, evidence.hash);

    return {
      isIntact: hashVerification.isValid,
      fileHash: hashVerification.calculatedHash,
      hashMatches: hashVerification.isValid,
      message: hashVerification.isValid
        ? 'Arquivo íntegro - hash confere'
        : 'ATENÇÃO: Arquivo foi modificado - hash não confere',
    };
  }

  /**
   * Verifica arquivo enviado contra evidências existentes
   * @param file Arquivo enviado para verificação
   * @returns Resultado da verificação
   */
  async verifyFileAgainstEvidence(file: Express.Multer.File): Promise<QuickVerificationDto> {
    try {
      // Calcular hash do arquivo enviado
      const fileHash = await this.hashService.calculateFileHash(file.path);

      // Buscar evidência com este hash
      const evidence = await this.prisma.evidence.findUnique({
        where: { hash: fileHash },
      });

      if (!evidence) {
        return {
          isIntact: false,
          fileHash,
          hashMatches: false,
          message: 'Arquivo não encontrado no sistema de evidências',
        };
      }

      // Verificar integridade da evidência encontrada
      const hashVerification = await this.verifyHash(evidence.path, evidence.hash);

      return {
        isIntact: hashVerification.isValid,
        fileHash,
        hashMatches: true,
        message: hashVerification.isValid
          ? 'Arquivo encontrado e íntegro no sistema'
          : 'ATENÇÃO: Evidência encontrada mas arquivo original foi modificado',
      };
    } catch (error) {
      this.logger.error('Erro na verificação de arquivo:', error);
      return {
        isIntact: false,
        fileHash: '',
        hashMatches: false,
        message: `Erro na verificação: ${error.message}`,
      };
    }
  }

  /**
   * Verifica integridade do hash
   */
  private async verifyHash(filePath: string, storedHash: string): Promise<HashVerificationDto> {
    try {
      if (!existsSync(filePath)) {
        return {
          isValid: false,
          storedHash,
          calculatedHash: '',
          message: 'Arquivo não encontrado no sistema',
        };
      }

      const fileBuffer = readFileSync(filePath);
      const calculatedHash = await this.hashService.calculateFileHash(filePath);
      const isValid = this.hashService.verifyHash(calculatedHash, storedHash);

      return {
        isValid,
        storedHash,
        calculatedHash,
        message: isValid ? 'Hash íntegro' : 'Hash não confere - arquivo foi modificado',
      };
    } catch (error) {
      this.logger.error('Erro na verificação de hash:', error);
      return {
        isValid: false,
        storedHash,
        calculatedHash: '',
        message: `Erro na verificação: ${error.message}`,
      };
    }
  }

  /**
   * Verifica assinatura digital
   */
  private async verifySignature(
    hash: string,
    signatureFile: string,
    publicKey: string,
  ): Promise<SignatureVerificationDto> {
    try {
      const verification = await this.signatureService.verifySignature(
        hash,
        signatureFile
      );

      if (verification) {
        const keyInfo = await this.signatureService.getKeyInfo();
        return {
          isValid: true,
          publicKeyInfo: {
            keyId: keyInfo.keyId,
            userId: keyInfo.userIds[0] || 'N/A',
            algorithm: keyInfo.algorithm,
            created: keyInfo.creationTime.toISOString(),
          },
          message: 'Assinatura digital válida',
        };
      } else {
        return {
          isValid: false,
          message: 'Assinatura digital inválida',
          error: 'Assinatura inválida',
        };
      }
    } catch (error) {
      this.logger.error('Erro na verificação de assinatura:', error);
      return {
        isValid: false,
        message: 'Erro na verificação da assinatura',
        error: error.message,
      };
    }
  }

  /**
   * Verifica timestamp
   */
  private async verifyTimestamp(
    hash: string,
    timestampFile: string,
  ): Promise<TimestampVerificationDto> {
    try {
      const verification = await this.timestampService.verifyTimestamp(hash, timestampFile);

      return {
        isValid: verification.isValid,
        timestamp: verification.timestamp?.toISOString(),
        blockHeight: verification.blockHeight,
        source: 'OpenTimestamps',
        message: verification.isValid ? 'Timestamp válido' : 'Timestamp inválido',
        error: verification.error,
      };
    } catch (error) {
      this.logger.error('Erro na verificação de timestamp:', error);
      return {
        isValid: false,
        source: 'OpenTimestamps',
        message: 'Erro na verificação do timestamp',
        error: error.message,
      };
    }
  }

  /**
   * Verifica cadeia de custódia
   */
  private async verifyCustodyChain(evidenceId: string): Promise<CustodyVerificationDto> {
    try {
      const validation = await this.custodyService.validateCustodyChain(evidenceId);
      const chain = await this.custodyService.getCustodyChain(evidenceId);

      const actors = [...new Set(chain.map(entry => entry.actor))];
      const firstEntry = chain.length > 0 ? chain[0].createdAt : new Date();
      const lastEntry = chain.length > 0 ? chain[chain.length - 1].createdAt : new Date();

      return {
        isValid: validation.isValid,
        totalEntries: chain.length,
        firstEntry: firstEntry.toISOString(),
        lastEntry: lastEntry.toISOString(),
        actors,
        issues: validation.issues,
      };
    } catch (error) {
      this.logger.error('Erro na verificação da cadeia de custódia:', error);
      return {
        isValid: false,
        totalEntries: 0,
        firstEntry: new Date().toISOString(),
        lastEntry: new Date().toISOString(),
        actors: [],
        issues: [`Erro na verificação: ${error.message}`],
      };
    }
  }

  /**
   * Calcula pontuação de confiança (0-100)
   */
  private calculateConfidenceScore(verifications: {
    hashVerification: HashVerificationDto;
    signatureVerification?: SignatureVerificationDto;
    timestampVerification?: TimestampVerificationDto;
    custodyVerification: CustodyVerificationDto;
  }): number {
    let score = 0;

    // Hash é fundamental (40 pontos)
    if (verifications.hashVerification.isValid) {
      score += 40;
    }

    // Cadeia de custódia (30 pontos)
    if (verifications.custodyVerification.isValid) {
      score += 30;
    } else {
      // Penalizar baseado no número de problemas
      const issues = verifications.custodyVerification.issues.length;
      score += Math.max(0, 30 - (issues * 5));
    }

    // Assinatura digital (20 pontos)
    if (verifications.signatureVerification?.isValid) {
      score += 20;
    } else if (verifications.signatureVerification) {
      // Existe assinatura mas é inválida - penalizar
      score -= 10;
    }

    // Timestamp (10 pontos)
    if (verifications.timestampVerification?.isValid) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determina se a verificação geral é válida
   */
  private determineOverallValidity(verifications: {
    hashVerification: HashVerificationDto;
    signatureVerification?: SignatureVerificationDto;
    timestampVerification?: TimestampVerificationDto;
    custodyVerification: CustodyVerificationDto;
  }): boolean {
    // Hash deve sempre ser válido
    if (!verifications.hashVerification.isValid) {
      return false;
    }

    // Cadeia de custódia deve ser válida
    if (!verifications.custodyVerification.isValid) {
      return false;
    }

    // Se existe assinatura, deve ser válida
    if (verifications.signatureVerification && !verifications.signatureVerification.isValid) {
      return false;
    }

    return true;
  }

  /**
   * Gera resumo e recomendações
   */
  private generateSummaryAndRecommendations(data: {
    hashVerification: HashVerificationDto;
    signatureVerification?: SignatureVerificationDto;
    timestampVerification?: TimestampVerificationDto;
    custodyVerification: CustodyVerificationDto;
    overallValid: boolean;
    confidenceScore: number;
  }): { summary: string; recommendations: string[] } {
    const recommendations: string[] = [];
    let summary = '';

    if (data.overallValid) {
      summary = `Evidência VÁLIDA com ${data.confidenceScore}% de confiança. `;
      
      if (data.confidenceScore < 70) {
        summary += 'Algumas melhorias são recomendadas.';
        recommendations.push('Considere adicionar assinatura digital para maior segurança');
      } else if (data.confidenceScore < 90) {
        summary += 'Boa integridade, com pequenas melhorias possíveis.';
      } else {
        summary += 'Excelente integridade e autenticidade.';
      }
    } else {
      summary = `Evidência INVÁLIDA (${data.confidenceScore}% confiança). Problemas críticos detectados.`;
      recommendations.push('NÃO utilize esta evidência até resolver os problemas identificados');
    }

    // Recomendações específicas
    if (!data.hashVerification.isValid) {
      recommendations.push('CRÍTICO: Arquivo foi modificado - hash não confere');
    }

    if (!data.custodyVerification.isValid) {
      recommendations.push('CRÍTICO: Problemas na cadeia de custódia detectados');
    }

    if (!data.signatureVerification) {
      recommendations.push('Adicione assinatura digital para garantir autenticidade');
    }

    if (!data.timestampVerification) {
      recommendations.push('Adicione timestamp para prova temporal');
    }

    if (data.custodyVerification.issues.length > 0) {
      recommendations.push('Revise os problemas na cadeia de custódia');
    }

    return { summary, recommendations };
  }
}