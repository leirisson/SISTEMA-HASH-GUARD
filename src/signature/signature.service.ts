import { Injectable, Logger } from '@nestjs/common';
import * as openpgp from 'openpgp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);
  private privateKey: openpgp.PrivateKey | null = null;
  private publicKey: openpgp.PublicKey | null = null;

  constructor() {
    this.initializeKeys();
  }

  /**
   * Inicializa as chaves PGP
   */
  private async initializeKeys(): Promise<void> {
    try {
      const privateKeyPath = process.env.PGP_PRIVATE_KEY_PATH;
      const publicKeyPath = process.env.PGP_PUBLIC_KEY_PATH;
      const passphrase = process.env.PGP_PASSPHRASE;

      if (privateKeyPath && existsSync(privateKeyPath)) {
        const privateKeyArmored = readFileSync(privateKeyPath, 'utf8');
        this.privateKey = await openpgp.decryptKey({
          privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
          passphrase: passphrase || '',
        });
        this.logger.log('Chave privada PGP carregada com sucesso');
      }

      if (publicKeyPath && existsSync(publicKeyPath)) {
        const publicKeyArmored = readFileSync(publicKeyPath, 'utf8');
        this.publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored }) as openpgp.PublicKey;
        this.logger.log('Chave pública PGP carregada com sucesso');
      }

      if (!this.privateKey || !this.publicKey) {
        this.logger.warn('Chaves PGP não encontradas. Gerando novas chaves...');
        await this.generateKeyPair();
      }
    } catch (error) {
      this.logger.error('Erro ao inicializar chaves PGP:', error);
    }
  }

  /**
   * Gera um novo par de chaves PGP
   */
  private async generateKeyPair(): Promise<void> {
    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 4096,
        userIDs: [{ name: 'HashGuard System', email: 'system@hashguard.local' }],
        passphrase: process.env.PGP_PASSPHRASE || 'hashguard-default-passphrase',
      });

      this.privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: process.env.PGP_PASSPHRASE || 'hashguard-default-passphrase',
      });

      this.publicKey = await openpgp.readKey({ armoredKey: publicKey }) as openpgp.PublicKey;

      // Salvar chaves em arquivos
      const keysDir = './keys';
      if (!existsSync(keysDir)) {
        require('fs').mkdirSync(keysDir, { recursive: true });
      }

      writeFileSync(join(keysDir, 'private.asc'), privateKey);
      writeFileSync(join(keysDir, 'public.asc'), publicKey);

      this.logger.log('Novo par de chaves PGP gerado e salvo com sucesso');
    } catch (error) {
      this.logger.error('Erro ao gerar par de chaves PGP:', error);
      throw error;
    }
  }

  /**
   * Assina um hash usando a chave privada PGP
   * @param hash Hash a ser assinado
   * @returns Assinatura em formato armored
   */
  async signHash(hash: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Chave privada PGP não disponível');
    }

    try {
      const message = await openpgp.createMessage({ text: hash });
      const signature = await openpgp.sign({
        message,
        signingKeys: this.privateKey,
        detached: true,
      });

      this.logger.log(`Hash assinado com sucesso: ${hash.substring(0, 16)}...`);
      return signature as string;
    } catch (error) {
      this.logger.error('Erro ao assinar hash:', error);
      throw new Error(`Falha na assinatura: ${error.message}`);
    }
  }

  /**
   * Verifica uma assinatura usando a chave pública
   * @param hash Hash original
   * @param signature Assinatura a ser verificada
   * @returns true se a assinatura é válida
   */
  async verifySignature(hash: string, signature: string): Promise<boolean> {
    if (!this.publicKey) {
      throw new Error('Chave pública PGP não disponível');
    }

    try {
      const message = await openpgp.createMessage({ text: hash });
      const signatureObj = await openpgp.readSignature({ armoredSignature: signature });

      const verificationResult = await openpgp.verify({
        message,
        signature: signatureObj,
        verificationKeys: this.publicKey,
      });

      const { verified } = verificationResult.signatures[0];
      const isValid = await verified;

      this.logger.log(`Verificação de assinatura: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
      return !!isValid;
    } catch (error) {
      this.logger.error('Erro ao verificar assinatura:', error);
      return false;
    }
  }

  /**
   * Obtém a chave pública em formato armored
   * @returns Chave pública armored
   */
  async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Chave pública PGP não disponível');
    }

    return this.publicKey.armor();
  }

  /**
   * Obtém informações da chave pública
   * @returns Informações da chave
   */
  async getKeyInfo(): Promise<{
    keyId: string;
    fingerprint: string;
    userIds: string[];
    algorithm: string;
    bitSize: number;
    creationTime: Date;
  }> {
    if (!this.publicKey) {
      throw new Error('Chave pública PGP não disponível');
    }

    const keyId = this.publicKey.getKeyID().toHex();
    const fingerprint = this.publicKey.getFingerprint();
    const userIds = this.publicKey.getUserIDs();
    const algorithm = this.publicKey.getAlgorithmInfo().algorithm;
    const bitSize = this.publicKey.getAlgorithmInfo().bits || 0;
    const creationTime = this.publicKey.getCreationTime();

    return {
      keyId,
      fingerprint,
      userIds,
      algorithm,
      bitSize,
      creationTime,
    };
  }

  /**
   * Salva uma assinatura em arquivo
   * @param signature Assinatura armored
   * @param filePath Caminho do arquivo
   */
  async saveSignatureToFile(signature: string, filePath: string): Promise<void> {
    try {
      writeFileSync(filePath, signature);
      this.logger.log(`Assinatura salva em: ${filePath}`);
    } catch (error) {
      this.logger.error('Erro ao salvar assinatura:', error);
      throw new Error(`Falha ao salvar assinatura: ${error.message}`);
    }
  }

  /**
   * Carrega uma assinatura de arquivo
   * @param filePath Caminho do arquivo
   * @returns Assinatura armored
   */
  async loadSignatureFromFile(filePath: string): Promise<string> {
    try {
      if (!existsSync(filePath)) {
        throw new Error('Arquivo de assinatura não encontrado');
      }

      const signature = readFileSync(filePath, 'utf8');
      this.logger.log(`Assinatura carregada de: ${filePath}`);
      return signature;
    } catch (error) {
      this.logger.error('Erro ao carregar assinatura:', error);
      throw new Error(`Falha ao carregar assinatura: ${error.message}`);
    }
  }
}