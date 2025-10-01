import React, { useState, useEffect } from 'react';
import { Evidence } from '../../types/evidence';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  File,
  Calendar,
  Hash,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';

interface EvidenceListProps {
  evidences: Evidence[];
  onView: (evidence: Evidence) => void;
  onDelete: (id: string) => void;
  onDownload: (evidence: Evidence) => void;
  onAdd: () => void;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidences,
  onView,
  onDelete,
  onDownload,
  onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvidences, setFilteredEvidences] = useState<Evidence[]>(evidences);

  useEffect(() => {
    const filtered = evidences.filter(evidence =>
      evidence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evidence.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evidence.hash.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvidences(filtered);
  }, [evidences, searchTerm]);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'CORRUPTED':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-3 w-3" />;
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'CORRUPTED':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com busca e ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar evidências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-200 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hover-lift transition-all duration-200">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={onAdd} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover-lift transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Nova Evidência
          </Button>
        </div>
      </div>

      {/* Lista de evidências */}
      <div className="grid gap-4">
        {filteredEvidences.length === 0 ? (
          <Card className="text-center py-12 shadow-modern">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma evidência encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece adicionando sua primeira evidência.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={onAdd} className="bg-gradient-to-r from-primary to-primary/80">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Evidência
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEvidences.map((evidence, index) => (
            <Card 
              key={evidence.id} 
              className="shadow-modern hover:shadow-modern-hover hover-lift transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getFileIcon(evidence.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {evidence.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{evidence.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(evidence.status)}>
                    {getStatusIcon(evidence.status)}
                    <span className="ml-1">{evidence.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span className="font-mono text-xs truncate">{evidence.hash}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <File className="h-4 w-4" />
                    <span>{formatFileSize(evidence.size)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(evidence.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(evidence)}
                    className="flex-1 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(evidence)}
                    className="flex-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive/5 hover:border-destructive/20 hover:text-destructive transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="animate-slide-up">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a evidência "{evidence.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(evidence.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};