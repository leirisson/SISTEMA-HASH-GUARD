import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EvidenceChart } from '@/components/dashboard/EvidenceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Shield, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useEvidenceStore } from '@/stores/evidenceStore';
import { useUserStore } from '@/stores/userStore';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { evidences, fetchEvidences, statistics } = useEvidenceStore();
  const { users, fetchUsers, statistics: userStats } = useUserStore();

  useEffect(() => {
    fetchEvidences();
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [fetchEvidences, fetchUsers, user?.role]);

  const stats = [
    {
      title: 'Total de Evidências',
      value: statistics.total,
      icon: FileText,
      description: 'Evidências registradas',
      trend: '+12%',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      delay: 'animate-delay-100'
    },
    {
      title: 'Evidências Ativas',
      value: statistics.active,
      icon: CheckCircle,
      description: 'Em análise',
      trend: '+8%',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      delay: 'animate-delay-200'
    },
    {
      title: 'Pendentes',
      value: statistics.pending,
      icon: Clock,
      description: 'Aguardando revisão',
      trend: '-5%',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      delay: 'animate-delay-300'
    },
    ...(user?.role === 'ADMIN' ? [{
      title: 'Usuários Ativos',
      value: userStats.active,
      icon: Users,
      description: 'Usuários no sistema',
      trend: '+3%',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      delay: 'animate-delay-400'
    }] : [])
  ];

  const recentEvidences = evidences.slice(0, 5);

  return (
    <div className="spacing-mobile">
      {/* Header */}
      <div className="flex-responsive items-start justify-between">
        <div className="animate-fade-in">
          <h1 className="text-responsive-xl font-bold bg-gradient-text bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-responsive-sm text-muted-foreground mt-1">
            Bem-vindo de volta, {user?.username}! Aqui está um resumo das suas atividades.
          </p>
        </div>
        <Link to="/evidence">
          <Button className="gap-2 btn-responsive hover-lift">
            <Plus className="h-4 w-4" />
            Nova Evidência
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-responsive">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`hover-lift ${stat.delay} animate-slide-up card-responsive`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-responsive-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-responsive-lg font-bold">{stat.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid-responsive-2">
        {/* Recent Evidences */}
        <Card className="animate-slide-up animate-delay-500 card-responsive">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-responsive-base flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Evidências Recentes
                </CardTitle>
                <CardDescription>
                  Últimas evidências adicionadas ao sistema
                </CardDescription>
              </div>
              <Link to="/evidence">
                <Button variant="ghost" size="sm" className="gap-2 btn-responsive">
                  Ver todas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvidences.map((evidence, index) => (
                <div 
                  key={evidence.id} 
                  className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in animate-delay-${600 + (index * 100)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-responsive-sm">{evidence.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {evidence.type} • {new Date(evidence.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={evidence.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {evidence.status}
                  </Badge>
                </div>
              ))}
              {recentEvidences.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma evidência encontrada</p>
                  <p className="text-sm">Comece adicionando sua primeira evidência</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="animate-slide-up animate-delay-600 card-responsive">
          <CardHeader>
            <CardTitle className="text-responsive-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-responsive-sm">Sistema Operacional</p>
                    <p className="text-xs text-muted-foreground">Todos os serviços funcionando</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-responsive-sm">Performance</p>
                    <p className="text-xs text-muted-foreground">Tempo de resposta: 120ms</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Excelente</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-responsive-sm">Manutenção</p>
                    <p className="text-xs text-muted-foreground">Próxima: 15/01 às 02:00</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Agendada</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};