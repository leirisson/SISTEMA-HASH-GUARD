import { Injectable, Logger } from '@nestjs/common';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Importação condicional do OpenTimestamps
let OpenTimestamps: any;
try {
  OpenTimestamps = require('opentimestamps');
} catch (error) {
  console.warn('OpenTimestamps não disponível. Funcionalidade de timestamp será limitada.');
}

@Injectable()
export class TimestampService {
  private readonly logger = new Logger(TimestampService.name);
  private readonly calendarUrl: string;

  constructor() {
    this.calendarUrl = process.env.OTS_CALENDAR_URL || 'https://alice.btc.calendar.opentimestamps.org';
  }

  /**
   * Cria um timestamp para um hash usando OpenTimestamps
   * @param hash Hash SHA-256 para timestamp
   * @returns Caminho do arquivo .ots gerado
   */
  async createTimestamp(hash: string): Promise<string> {
    if (!OpenTimestamps) {
      throw new Error('OpenTimestamps não está disponível');
    }

    try {
      // Converter hash para buffer
      const hashBuffer = Buffer.from(hash, 'hex');

      // Criar timestamp
      const detachedTimestamp = OpenTimestamps.DetachedTimestampFile.fromHash(
        new OpenTimestamps.Ops.OpSHA256(),
        hashBuffer
      );

      // Submeter para calendários
      await OpenTimestamps.stamp(detachedTimestamp);

      // Gerar nome do arquivo .ots
      const timestampDir = './timestamps';
      if (!existsSync(timestampDir)) {
        require('fs').mkdirSync(timestampDir, { recursive: true });
      }

      const otsFilePath = join(timestampDir, `${hash}.ots`);

      // Salvar arquivo .ots
      const otsData = detachedTimestamp.serializeToBytes();
      writeFileSync(otsFilePath, otsData);

      this.logger.log(`Timestamp criado com sucesso: ${otsFilePath}`);
      return otsFilePath;
    } catch (error) {
      this.logger.error('Erro ao criar timestamp:', error);
      throw new Error(`Falha na criação do timestamp: ${error.message}`);
    }
  }

  /**
   * Verifica um timestamp OpenTimestamps
   * @param hash Hash original
   * @param otsFilePath Caminho do arquivo .ots
   * @returns Resultado da verificação
   */
  async verifyTimestamp(hash: string, otsFilePath: string): Promise<{
    isValid: boolean;
    timestamp?: Date;
    blockHeight?: number;
    error?: string;
  }> {
    if (!OpenTimestamps) {
      return {
        isValid: false,
        error: 'OpenTimestamps não está disponível',
      };
    }

    try {
      if (!existsSync(otsFilePath)) {
        return {
          isValid: false,
          error: 'Arquivo .ots não encontrado',
        };
      }

      // Carregar arquivo .ots
      const otsData = readFileSync(otsFilePath);
      const detachedTimestamp = OpenTimestamps.DetachedTimestampFile.deserialize(otsData);

      // Converter hash para buffer
      const hashBuffer = Buffer.from(hash, 'hex');

      // Verificar timestamp
      const verificationResult = await OpenTimestamps.verify(detachedTimestamp, hashBuffer);

      if (verificationResult && verificationResult.length > 0) {
        const result = verificationResult[0];
        
        this.logger.log(`Timestamp verificado com sucesso para hash: ${hash.substring(0, 16)}...`);
        
        return {
          isValid: true,
          timestamp: new Date(result.timestamp * 1000),
          blockHeight: result.height,
        };
      } else {
        return {
          isValid: false,
          error: 'Timestamp não confirmado na blockchain',
        };
      }
    } catch (error) {
      this.logger.error('Erro ao verificar timestamp:', error);
      return {
        isValid: false,
        error: `Falha na verificação: ${error.message}`,
      };
    }
  }

  /**
   * Atualiza um timestamp pendente
   * @param otsFilePath Caminho do arquivo .ots
   * @returns true se foi atualizado
   */
  async upgradeTimestamp(otsFilePath: string): Promise<boolean> {
    if (!OpenTimestamps) {
      throw new Error('OpenTimestamps não está disponível');
    }

    try {
      if (!existsSync(otsFilePath)) {
        throw new Error('Arquivo .ots não encontrado');
      }

      // Carregar arquivo .ots
      const otsData = readFileSync(otsFilePath);
      const detachedTimestamp = OpenTimestamps.DetachedTimestampFile.deserialize(otsData);

      // Tentar atualizar
      const upgraded = await OpenTimestamps.upgrade(detachedTimestamp);

      if (upgraded) {
        // Salvar versão atualizada
        const upgradedData = detachedTimestamp.serializeToBytes();
        writeFileSync(otsFilePath, upgradedData);
        
        this.logger.log(`Timestamp atualizado com sucesso: ${otsFilePath}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Erro ao atualizar timestamp:', error);
      throw new Error(`Falha na atualização do timestamp: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um arquivo .ots
   * @param otsFilePath Caminho do arquivo .ots
   * @returns Informações do timestamp
   */
  async getTimestampInfo(otsFilePath: string): Promise<{
    fileHash: string;
    isPending: boolean;
    calendars: string[];
    size: number;
  }> {
    if (!OpenTimestamps) {
      throw new Error('OpenTimestamps não está disponível');
    }

    try {
      if (!existsSync(otsFilePath)) {
        throw new Error('Arquivo .ots não encontrado');
      }

      const otsData = readFileSync(otsFilePath);
      const detachedTimestamp = OpenTimestamps.DetachedTimestampFile.deserialize(otsData);

      // Extrair informações básicas
      const fileHash = detachedTimestamp.fileDigest().toString('hex');
      const size = otsData.length;

      // Verificar se está pendente (simplificado)
      const isPending = !detachedTimestamp.timestamp;

      // Lista de calendários (simplificado)
      const calendars = [this.calendarUrl];

      return {
        fileHash,
        isPending,
        calendars,
        size,
      };
    } catch (error) {
      this.logger.error('Erro ao obter informações do timestamp:', error);
      throw new Error(`Falha ao obter informações: ${error.message}`);
    }
  }

  /**
   * Cria um timestamp simples baseado em tempo local (fallback)
   * @param hash Hash para timestamp
   * @returns Informações do timestamp local
   */
  async createLocalTimestamp(hash: string): Promise<{
    hash: string;
    timestamp: Date;
    source: string;
  }> {
    const timestamp = new Date();
    
    this.logger.log(`Timestamp local criado para hash: ${hash.substring(0, 16)}...`);
    
    return {
      hash,
      timestamp,
      source: 'LOCAL_SYSTEM',
    };
  }

  /**
   * Valida se um hash é adequado para timestamp
   * @param hash Hash a ser validado
   * @returns true se é válido
   */
  isValidHashForTimestamp(hash: string): boolean {
    // Verificar se é um hash SHA-256 válido
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    return sha256Regex.test(hash);
  }
}