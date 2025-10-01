import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CustodyLogEntry {
  id: string;
  evidenceId: string;
  action: string;
  actor: string;
  details?: any;
  createdAt: Date;
}

@Injectable()
export class CustodyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma ação na cadeia de custódia
   * @param evidenceId ID da evidência
   * @param action Ação realizada
   * @param actor Pessoa/sistema que realizou a ação
   * @param details Detalhes adicionais da ação
   */
  async logAction(
    evidenceId: string,
    action: string,
    actor: string,
    details?: any,
  ): Promise<CustodyLogEntry> {
    // Verificar se a evidência existe
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    // Se o actor for 'SYSTEM', usar null para o relacionamento com User
    // Caso contrário, verificar se o usuário existe
    let actorId = null;
    if (actor !== 'SYSTEM') {
      const user = await this.prisma.user.findUnique({
        where: { id: actor },
      });
      if (user) {
        actorId = actor;
      }
    }

    // Criar registro na cadeia de custódia
    const custodyLog = await this.prisma.custodyLog.create({
      data: {
        evidenceId,
        action: action.toUpperCase(),
        actor: actor, // Manter o valor original como string
        details: details || {},
      },
    });

    return custodyLog;
  }

  /**
   * Recupera toda a cadeia de custódia de uma evidência
   * @param evidenceId ID da evidência
   * @returns Array com todos os logs de custódia
   */
  async getCustodyChain(evidenceId: string): Promise<CustodyLogEntry[]> {
    // Verificar se a evidência existe
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    const custodyLogs = await this.prisma.custodyLog.findMany({
      where: { evidenceId },
      orderBy: { createdAt: 'asc' },
    });

    return custodyLogs;
  }

  /**
   * Recupera o último registro de custódia de uma evidência
   * @param evidenceId ID da evidência
   * @returns Último registro de custódia
   */
  async getLastCustodyEntry(evidenceId: string): Promise<CustodyLogEntry | null> {
    const lastEntry = await this.prisma.custodyLog.findFirst({
      where: { evidenceId },
      orderBy: { createdAt: 'desc' },
    });

    return lastEntry;
  }

  /**
   * Recupera todos os logs de custódia de um ator específico
   * @param actor Nome do ator
   * @returns Array com logs do ator
   */
  async getLogsByActor(actor: string): Promise<CustodyLogEntry[]> {
    const logs = await this.prisma.custodyLog.findMany({
      where: { actor },
      orderBy: { createdAt: 'desc' },
      include: {
        evidence: {
          select: {
            id: true,
            filename: true,
            hash: true,
          },
        },
      },
    });

    return logs;
  }

  /**
   * Recupera logs de custódia por tipo de ação
   * @param action Tipo de ação
   * @returns Array com logs da ação
   */
  async getLogsByAction(action: string): Promise<CustodyLogEntry[]> {
    const logs = await this.prisma.custodyLog.findMany({
      where: { action: action.toUpperCase() },
      orderBy: { createdAt: 'desc' },
      include: {
        evidence: {
          select: {
            id: true,
            filename: true,
            hash: true,
          },
        },
      },
    });

    return logs;
  }

  /**
   * Gera relatório de custódia para uma evidência
   * @param evidenceId ID da evidência
   * @returns Relatório detalhado da cadeia de custódia
   */
  async generateCustodyReport(evidenceId: string): Promise<{
    evidence: any;
    custodyChain: CustodyLogEntry[];
    summary: {
      totalActions: number;
      firstAction: Date;
      lastAction: Date;
      actors: string[];
      actions: string[];
    };
  }> {
    // Buscar evidência
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    // Buscar cadeia de custódia
    const custodyChain = await this.getCustodyChain(evidenceId);

    // Gerar resumo
    const actors = [...new Set(custodyChain.map(log => log.actor))];
    const actions = [...new Set(custodyChain.map(log => log.action))];
    const firstAction = custodyChain.length > 0 ? custodyChain[0].createdAt : null;
    const lastAction = custodyChain.length > 0 ? custodyChain[custodyChain.length - 1].createdAt : null;

    return {
      evidence,
      custodyChain,
      summary: {
        totalActions: custodyChain.length,
        firstAction,
        lastAction,
        actors,
        actions,
      },
    };
  }

  /**
   * Valida a integridade da cadeia de custódia
   * @param evidenceId ID da evidência
   * @returns Resultado da validação
   */
  async validateCustodyChain(evidenceId: string): Promise<{
    isValid: boolean;
    issues: string[];
    totalEntries: number;
    integrityScore: number;
    recommendations: string[];
  }> {
    const custodyChain = await this.getCustodyChain(evidenceId);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar se existe pelo menos um registro de upload
    const hasUpload = custodyChain.some(log => log.action === 'UPLOAD');
    if (!hasUpload) {
      issues.push('Não há registro de upload inicial da evidência');
    }

    // Verificar gaps temporais suspeitos (mais de 24 horas entre ações)
    for (let i = 1; i < custodyChain.length; i++) {
      const timeDiff = custodyChain[i].createdAt.getTime() - custodyChain[i - 1].createdAt.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        issues.push(`Gap temporal de ${Math.round(hoursDiff)} horas entre ações em ${custodyChain[i - 1].createdAt} e ${custodyChain[i].createdAt}`);
      }
    }

    // Verificar se há verificações de integridade regulares
    const integrityChecks = custodyChain.filter(log => log.action === 'INTEGRITY_CHECK');
    if (integrityChecks.length === 0) {
      recommendations.push('Recomenda-se realizar verificações de integridade periodicamente');
    }

    // Verificar se há múltiplos atores (boa prática para auditoria)
    const uniqueActors = new Set(custodyChain.map(log => log.actor));
    if (uniqueActors.size === 1) {
      recommendations.push('Recomenda-se envolver múltiplos atores na cadeia de custódia para maior auditabilidade');
    }

    // Calcular pontuação de integridade
    const totalEntries = custodyChain.length;
    let integrityScore = 100;
    
    // Reduzir pontuação baseado nos problemas encontrados
    integrityScore -= issues.length * 20;
    
    // Bonus por ter verificações de integridade
    if (integrityChecks.length > 0) {
      integrityScore += 10;
    }
    
    // Bonus por múltiplos atores
    if (uniqueActors.size > 1) {
      integrityScore += 5;
    }
    
    // Garantir que a pontuação esteja entre 0 e 100
    integrityScore = Math.max(0, Math.min(100, integrityScore));

    return {
      isValid: issues.length === 0,
      issues,
      totalEntries,
      integrityScore,
      recommendations,
    };
  }
}