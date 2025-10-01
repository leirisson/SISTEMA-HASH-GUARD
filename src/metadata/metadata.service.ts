import { Injectable, Logger } from '@nestjs/common';
import { exiftool } from 'exiftool-vendored';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  /**
   * Extrai metadados EXIF de um arquivo
   * @param filePath Caminho para o arquivo
   * @returns Objeto com metadados EXIF ou null se não houver
   */
  async extractMetadata(filePath: string): Promise<any> {
    try {
      const metadata = await exiftool.read(filePath);
      
      // Filtrar apenas metadados relevantes para evidências forenses
      const relevantMetadata = {
        // Informações básicas do arquivo
        fileName: metadata.FileName,
        fileSize: metadata.FileSize,
        fileType: metadata.FileType,
        mimeType: metadata.MIMEType,
        
        // Informações de data/hora
        createDate: metadata.CreateDate,
        modifyDate: metadata.ModifyDate,
        dateTimeOriginal: metadata.DateTimeOriginal,
        
        // Informações da câmera/dispositivo
        make: metadata.Make,
        model: metadata.Model,
        software: metadata.Software,
        
        // Configurações da câmera
        exposureTime: metadata.ExposureTime,
        fNumber: metadata.FNumber,
        iso: metadata.ISO,
        flash: metadata.Flash,
        focalLength: metadata.FocalLength,
        
        // Informações de localização (GPS)
        gpsLatitude: metadata.GPSLatitude,
        gpsLongitude: metadata.GPSLongitude,
        gpsAltitude: metadata.GPSAltitude,
        gpsDateTime: metadata.GPSDateTime,
        
        // Informações de imagem
        imageWidth: metadata.ImageWidth,
        imageHeight: metadata.ImageHeight,
        colorSpace: metadata.ColorSpace,
        orientation: metadata.Orientation,
        
        // Hash e checksums se disponíveis
        md5: (metadata as any).MD5,
        sha1: (metadata as any).SHA1,
        
        // Informações adicionais para vídeos
        duration: metadata.Duration,
        videoCodec: metadata.VideoCodec,
        audioCodec: metadata.AudioCodec,
        frameRate: metadata.VideoFrameRate,
        
        // Metadados completos (para análise forense detalhada)
        rawMetadata: metadata,
      };

      // Remover campos undefined/null para economizar espaço
      const cleanedMetadata = Object.fromEntries(
        Object.entries(relevantMetadata).filter(([_, value]) => value !== undefined && value !== null)
      );

      this.logger.log(`Metadados extraídos com sucesso para: ${filePath}`);
      return cleanedMetadata;

    } catch (error) {
      this.logger.warn(`Erro ao extrair metadados de ${filePath}: ${error.message}`);
      throw new Error(`Falha na extração de metadados: ${error.message}`);
    }
  }

  /**
   * Verifica se um arquivo contém metadados GPS
   * @param filePath Caminho para o arquivo
   * @returns true se contém dados GPS
   */
  async hasGPSData(filePath: string): Promise<boolean> {
    try {
      const metadata = await this.extractMetadata(filePath);
      return !!(metadata.gpsLatitude && metadata.gpsLongitude);
    } catch (error) {
      return false;
    }
  }

  /**
   * Extrai apenas informações de data/hora do arquivo
   * @param filePath Caminho para o arquivo
   * @returns Objeto com informações temporais
   */
  async extractDateTimeInfo(filePath: string): Promise<any> {
    try {
      const metadata = await exiftool.read(filePath);
      
      return {
        createDate: metadata.CreateDate,
        modifyDate: metadata.ModifyDate,
        dateTimeOriginal: metadata.DateTimeOriginal,
        gpsDateTime: metadata.GPSDateTime,
        fileModifyDate: metadata.FileModifyDate,
        fileAccessDate: metadata.FileAccessDate,
        fileCreateDate: metadata.FileCreateDate,
      };
    } catch (error) {
      this.logger.warn(`Erro ao extrair informações de data/hora: ${error.message}`);
      return null;
    }
  }

  /**
   * Limpa recursos do exiftool (deve ser chamado no shutdown da aplicação)
   */
  async cleanup(): Promise<void> {
    try {
      await exiftool.end();
      this.logger.log('ExifTool finalizado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao finalizar ExifTool:', error);
    }
  }
}