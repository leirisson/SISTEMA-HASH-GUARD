import { create } from 'zustand';
import { Evidence, EvidenceUpload, EvidenceFilter } from '@/types/evidence';
import { evidenceService } from '@/services/evidenceService';

interface EvidenceState {
  evidences: Evidence[];
  currentEvidence: Evidence | null;
  loading: boolean;
  error: string | null;
  filters: EvidenceFilter;
  
  // Actions
  setFilters: (filters: EvidenceFilter) => void;
  fetchEvidences: () => Promise<void>;
  fetchEvidence: (id: string) => Promise<void>;
  uploadEvidence: (evidenceData: EvidenceUpload) => Promise<Evidence>;
  verifyEvidence: (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => Promise<void>;
  downloadEvidence: (id: string) => Promise<void>;
  clearError: () => void;
  clearCurrentEvidence: () => void;
}

export const useEvidenceStore = create<EvidenceState>((set, get) => ({
  evidences: [],
  currentEvidence: null,
  loading: false,
  error: null,
  filters: {},

  setFilters: (filters) => {
    set({ filters });
    get().fetchEvidences();
  },

  fetchEvidences: async () => {
    set({ loading: true, error: null });
    try {
      const evidences = await evidenceService.getEvidences(get().filters);
      set({ evidences, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar evidências',
        loading: false 
      });
    }
  },

  fetchEvidence: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const evidence = await evidenceService.getEvidence(id);
      set({ currentEvidence: evidence, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao carregar evidência',
        loading: false 
      });
    }
  },

  uploadEvidence: async (evidenceData: EvidenceUpload) => {
    set({ loading: true, error: null });
    try {
      const evidence = await evidenceService.uploadEvidence(evidenceData);
      set((state) => ({
        evidences: [evidence, ...state.evidences],
        loading: false
      }));
      return evidence;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao fazer upload da evidência',
        loading: false 
      });
      throw error;
    }
  },

  verifyEvidence: async (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => {
    set({ loading: true, error: null });
    try {
      await evidenceService.verifyEvidence(id, status, notes);
      
      // Atualizar evidência na lista
      set((state) => ({
        evidences: state.evidences.map(evidence =>
          evidence.id === id ? { ...evidence, status } : evidence
        ),
        currentEvidence: state.currentEvidence?.id === id 
          ? { ...state.currentEvidence, status }
          : state.currentEvidence,
        loading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao verificar evidência',
        loading: false 
      });
    }
  },

  downloadEvidence: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const blob = await evidenceService.downloadEvidence(id);
      const evidence = get().evidences.find(e => e.id === id) || get().currentEvidence;
      
      if (evidence) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = evidence.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Erro ao baixar evidência',
        loading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentEvidence: () => set({ currentEvidence: null }),
}));