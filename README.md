# 📂 HashGuard

**HashGuard** é um sistema em **NestJS** para preservação e verificação de **evidências digitais** (como fotos, documentos ou vídeos).  
Ele combina **hashes criptográficos, assinaturas digitais, timestamps e cadeia de custódia** para garantir que um arquivo não foi alterado e pode ser usado como prova confiável.

---

## ✨ Funcionalidades

- 📤 **Upload de arquivos** (fotos, vídeos, documentos).  
- 🔐 **Geração de hash (SHA-256)** para garantir integridade.  
- 🗂 **Extração e armazenamento de metadados** (EXIF, data, local, dispositivo).  
- ⏰ **Timestamp** (carimbo de data/hora via OpenTimestamps).  
- ✍️ **Assinatura digital** (PGP ou chave RSA/ECDSA).  
- 📖 **Cadeia de custódia** (registro de quem manipulou a evidência).  
- ✅ **Verificação completa** (comparar hash, validar assinatura e timestamp).  

---

## 🏗️ Arquitetura

O sistema é dividido em módulos independentes:

