import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';

@Injectable()
export class HashService {
  /**
   * Calcula o hash SHA-256 de um arquivo
   * @param filePath Caminho para o arquivo
   * @returns Promise com o hash SHA-256 em hexadecimal
   */
  async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        const fileHash = hash.digest('hex');
        resolve(fileHash);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Calcula o hash SHA-256 de um buffer
   * @param buffer Buffer de dados
   * @returns Hash SHA-256 em hexadecimal
   */
  calculateBufferHash(buffer: Buffer): string {
    const hash = createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Verifica se dois hashes são idênticos
   * @param hash1 Primeiro hash
   * @param hash2 Segundo hash
   * @returns true se os hashes são idênticos
   */
  verifyHash(hash1: string, hash2: string): boolean {
    return hash1.toLowerCase() === hash2.toLowerCase();
  }

  /**
   * Valida se uma string é um hash SHA-256 válido
   * @param hash String para validar
   * @returns true se é um hash SHA-256 válido
   */
  isValidSHA256(hash: string): boolean {
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    return sha256Regex.test(hash);
  }
}