import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.custodyLog.deleteMany();
  await prisma.evidence.deleteMany();

  // Criar evidências de teste
  const evidence1 = await prisma.evidence.create({
    data: {
      filename: 'documento_importante.pdf',
      path: '/uploads/evidence/documento_importante.pdf',
      hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
      exif: JSON.stringify({
        fileSize: 1024000,
        mimeType: 'application/pdf',
        createdDate: '2024-01-15T10:30:00Z'
      }),
      collectedBy: 'Investigador João Silva',
      collectedAt: new Date('2024-01-15T10:30:00Z'),
      timestampFile: '/uploads/timestamps/documento_importante.tsr',
      signatureFile: '/uploads/signatures/documento_importante.sig',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
    }
  });

  const evidence2 = await prisma.evidence.create({
    data: {
      filename: 'foto_cena_crime.jpg',
      path: '/uploads/evidence/foto_cena_crime.jpg',
      hash: 'b2c3d4e5f6789012345678901234567890abcdef1',
      exif: JSON.stringify({
        fileSize: 2048000,
        mimeType: 'image/jpeg',
        camera: 'Canon EOS 5D Mark IV',
        gps: { latitude: -23.5505, longitude: -46.6333 },
        createdDate: '2024-01-16T14:45:00Z'
      }),
      collectedBy: 'Perito Maria Santos',
      collectedAt: new Date('2024-01-16T14:45:00Z'),
      timestampFile: '/uploads/timestamps/foto_cena_crime.tsr',
      signatureFile: '/uploads/signatures/foto_cena_crime.sig',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
    }
  });

  const evidence3 = await prisma.evidence.create({
    data: {
      filename: 'video_depoimento.mp4',
      path: '/uploads/evidence/video_depoimento.mp4',
      hash: 'c3d4e5f6789012345678901234567890abcdef12',
      exif: JSON.stringify({
        fileSize: 50480000,
        mimeType: 'video/mp4',
        duration: 1800,
        resolution: '1920x1080',
        createdDate: '2024-01-17T09:15:00Z'
      }),
      collectedBy: 'Delegado Carlos Oliveira',
      collectedAt: new Date('2024-01-17T09:15:00Z'),
      timestampFile: '/uploads/timestamps/video_depoimento.tsr',
      signatureFile: '/uploads/signatures/video_depoimento.sig',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----'
    }
  });

  // Criar logs de custódia para as evidências
  await prisma.custodyLog.createMany({
    data: [
      {
        evidenceId: evidence1.id,
        action: 'COLLECTED',
        actor: 'Investigador João Silva',
        details: 'Evidência coletada na residência do suspeito'
      },
      {
        evidenceId: evidence1.id,
        action: 'TRANSFERRED',
        actor: 'Perito Técnico Ana Costa',
        details: 'Transferido para análise técnica'
      },
      {
        evidenceId: evidence2.id,
        action: 'COLLECTED',
        actor: 'Perito Maria Santos',
        details: 'Fotografia da cena do crime coletada'
      },
      {
        evidenceId: evidence2.id,
        action: 'ANALYZED',
        actor: 'Especialista em Imagem Pedro Lima',
        details: 'Análise de metadados e autenticidade realizada'
      },
      {
        evidenceId: evidence3.id,
        action: 'COLLECTED',
        actor: 'Delegado Carlos Oliveira',
        details: 'Gravação de depoimento da testemunha'
      },
      {
        evidenceId: evidence3.id,
        action: 'STORED',
        actor: 'Sistema Automático',
        details: 'Armazenado no cofre digital com timestamp'
      }
    ]
  });

  console.log('Seed concluído com sucesso!');
  console.log(`Criadas ${await prisma.evidence.count()} evidências`);
  console.log(`Criados ${await prisma.custodyLog.count()} logs de custódia`);
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });