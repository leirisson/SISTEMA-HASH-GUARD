# EvidenSafe Frontend

Sistema de gerenciamento de evidências digitais com autenticação JWT e controle de acesso baseado em papéis (RBAC).

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e servidor de desenvolvimento
- **Tailwind CSS** - Framework CSS utilitário
- **Shadcn/UI** - Componentes de interface modernos
- **Zustand** - Gerenciamento de estado global
- **React Router DOM** - Roteamento de páginas
- **Axios** - Cliente HTTP para APIs
- **Chart.js** - Gráficos interativos
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones modernos

## 📋 Funcionalidades

### 🔐 Autenticação e Autorização
- Login seguro com JWT
- Controle de acesso baseado em papéis (USER, SUPER, ADMIN)
- Proteção de rotas
- Logout automático em caso de token expirado

### 📊 Dashboard Interativo
- **Estatísticas em tempo real** de evidências
- **Gráficos Chart.js** para supervisores e administradores:
  - Gráfico de barras: evidências por mês
  - Gráfico de rosca: distribuição por status
- **Atividade recente** com timestamps
- **Status do sistema** em tempo real

### 📁 Módulo de Evidências
- **Upload de arquivos** com drag-and-drop
- **Listagem** com filtros avançados
- **Busca** por nome, descrição ou tags
- **Visualização** de detalhes completos
- **Sistema de verificação** de integridade
- **Download seguro** de evidências
- **Controle de acesso** baseado em papéis

### 👥 Gerenciamento de Usuários (Apenas Admins)
- **Criação** de novos usuários
- **Edição** de perfis e permissões
- **Ativação/Desativação** de contas
- **Listagem** com filtros por papel e status
- **Exclusão** de usuários
- **Validação** de dados com feedback visual

## 🏗️ Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base (Shadcn/UI)
│   ├── layout/          # Layout da aplicação
│   ├── dashboard/       # Componentes do dashboard
│   ├── evidence/        # Componentes de evidências
│   └── users/           # Componentes de usuários
├── pages/               # Páginas da aplicação
├── stores/              # Gerenciamento de estado (Zustand)
├── services/            # Serviços de API
├── types/               # Definições TypeScript
├── lib/                 # Utilitários
└── assets/              # Recursos estáticos
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Backend EvidenSafe rodando

### Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd evidensafe-frontend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=EvidenSafe
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

5. **Acesse a aplicação:**
```
http://localhost:5173
```

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 🔒 Controle de Acesso

### Papéis de Usuário

| Papel | Permissões |
|-------|------------|
| **USER** | Visualizar evidências, fazer upload básico |
| **SUPER** | Todas as permissões de USER + verificar evidências, acessar dashboard |
| **ADMIN** | Todas as permissões + gerenciar usuários, configurações do sistema |

### Rotas Protegidas

- `/dashboard` - Todos os usuários autenticados
- `/evidence` - Todos os usuários autenticados
- `/users` - Apenas ADMIN
- `/settings` - Baseado em permissões específicas

## 🎨 Componentes Principais

### Layout
- **Header**: Navegação superior com informações do usuário
- **Sidebar**: Menu lateral com navegação baseada em papéis
- **Layout**: Container principal responsivo

### Dashboard
- **StatsCard**: Cards de estatísticas com ícones
- **EvidenceChart**: Gráficos Chart.js configuráveis
- **RecentActivity**: Lista de atividades recentes

### Evidências
- **EvidenceUpload**: Formulário de upload com drag-and-drop
- **EvidenceList**: Listagem com filtros e ações
- **EvidenceCard**: Card individual de evidência

### Usuários
- **UserForm**: Formulário de criação/edição
- **UserList**: Listagem com gerenciamento completo

## 🔄 Gerenciamento de Estado

### Stores (Zustand)

#### AuthStore
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

#### EvidenceStore
```typescript
interface EvidenceState {
  evidences: Evidence[];
  filters: EvidenceFilter;
  loading: boolean;
  fetchEvidences: () => Promise<void>;
  uploadEvidence: (data) => Promise<void>;
  // ... outras ações
}
```

#### UserStore
```typescript
interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  createUser: (data) => Promise<void>;
  updateUser: (id, data) => Promise<void>;
  // ... outras ações
}
```

## 🌐 Integração com API

### Configuração do Axios
- Interceptors automáticos para JWT
- Tratamento de erros centralizado
- Base URL configurável via ambiente

### Endpoints Principais
```typescript
// Autenticação
POST /auth/login
POST /auth/refresh
GET /auth/profile

// Evidências
GET /evidence
POST /evidence/upload
GET /evidence/:id
PATCH /evidence/:id/verify
GET /evidence/:id/download

// Usuários (Admin)
GET /users
POST /users
PATCH /users/:id
DELETE /users/:id
```

## 🎨 Estilização

### Tailwind CSS
- Design system consistente
- Responsividade mobile-first
- Dark mode ready
- Componentes utilitários

### Shadcn/UI
- Componentes acessíveis
- Customização via CSS variables
- Animações suaves
- Temas configuráveis

## 🔍 Funcionalidades Avançadas

### Upload de Evidências
- Drag-and-drop intuitivo
- Validação de tipos de arquivo
- Progress bar de upload
- Preview de arquivos
- Metadados automáticos

### Filtros e Busca
- Busca em tempo real
- Filtros combinados
- Persistência de filtros
- Ordenação customizável

### Gráficos Interativos
- Chart.js responsivo
- Dados em tempo real
- Múltiplos tipos de gráfico
- Exportação de dados

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Variáveis de Ambiente de Produção
```env
VITE_API_URL=https://api.evidensafe.com
VITE_APP_NAME=EvidenSafe
```

### Configuração do Servidor
- Servir arquivos estáticos da pasta `dist/`
- Configurar fallback para SPA routing
- Headers de segurança apropriados

## 🔧 Desenvolvimento

### Estrutura de Componentes
```typescript
// Exemplo de componente
interface ComponentProps {
  // Props tipadas
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Hooks
  // Estado local
  // Efeitos
  // Handlers
  
  return (
    // JSX
  );
};
```

### Padrões de Código
- Componentes funcionais com hooks
- TypeScript strict mode
- Props interfaces bem definidas
- Tratamento de erros consistente
- Loading states em todas as operações

### Testes (Futuro)
- Jest + React Testing Library
- Testes unitários de componentes
- Testes de integração
- E2E com Cypress

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação da API
- Verifique os logs do console para debugging

---

**EvidenSafe** - Sistema de Gerenciamento de Evidências Digitais 🔒
