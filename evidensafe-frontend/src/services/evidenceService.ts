import api from './api';
import { Evidence, EvidenceUpload, EvidenceFilter } from '@/types/evidence';

export const evidenceService = {
  // Listar evidências com filtros
  getEvidences: async (filters?: EvidenceFilter): Promise<Evidence[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/evidence?${params.toString()}`);
    return response.data;
  },

  // Obter evidência por ID
  getEvidence: async (id: string): Promise<Evidence> => {
    const response = await api.get(`/evidence/${id}`);
    return response.data;
  },

  // Upload de evidência
  uploadEvidence: async (evidenceData: EvidenceUpload): Promise<Evidence> => {
    const formData = new FormData();
    formData.append('file', evidenceData.file);
    
    if (evidenceData.description) {
      formData.append('description', evidenceData.description);
    }
    
    if (evidenceData.tags && evidenceData.tags.length > 0) {
      formData.append('tags', JSON.stringify(evidenceData.tags));
    }
    
    if (evidenceData.location) {
      formData.append('location', evidenceData.location);
    }

    const response = await api.post('/evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Verificar evidência
  verifyEvidence: async (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<void> => {
    await api.post(`/evidence/${id}/verify`, {
      status,
      notes,
    });
  },

  // Download de evidência
  downloadEvidence: async (id: string): Promise<Blob> => {
    const response = await api.get(`/evidence/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Obter hash da evidência
  getEvidenceHash: async (id: string): Promise<{ hash: string }> => {
    const response = await api.get(`/evidence/${id}/hash`);
    return response.data;
  },
};