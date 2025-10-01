import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { UserList } from '@/components/users/UserList';

export const UsersPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <UserList />
      </div>
    </Layout>
  );
};