export interface Evidence {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  metadata?: {
    description?: string;
    tags?: string[];
    location?: string;
    timestamp?: string;
  };
  verifications?: Verification[];
}

export interface Verification {
  id: string;
  evidenceId: string;
  verifiedBy: string;
  verifiedAt: string;
  status: 'VERIFIED' | 'REJECTED';
  notes?: string;
  signature?: string;
}

export interface EvidenceUpload {
  file: File;
  description?: string;
  tags?: string[];
  location?: string;
}

export interface EvidenceFilter {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}