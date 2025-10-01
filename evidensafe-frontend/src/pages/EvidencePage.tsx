import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { EvidenceList } from '@/components/evidence/EvidenceList';

export const EvidencePage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evidências</h1>
          <p className="text-gray-600 mt-2">
            Gerencie e visualize evidências digitais do sistema
          </p>
        </div>
        
        <EvidenceList />
      </div>
    </Layout>
  );
};