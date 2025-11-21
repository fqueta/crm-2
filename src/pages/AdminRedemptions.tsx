import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Truck,
  MoreHorizontal,
  Calendar,
  User,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { useAllRedemptions, useUpdateRedemptionStatus } from '@/hooks/redemptions';
import { 
  Redemption, 
  RedemptionStatus, 
  REDEMPTION_STATUSES
} from '@/types/redemptions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintButton } from '@/components/ui/PrintButton';
import '@/styles/print.css';



/**
 * Página administrativa para acompanhamento de resgates da loja de pontos
 * Permite visualizar, filtrar e gerenciar todos os pedidos de resgate
 */
const AdminRedemptions: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RedemptionStatus | 'all'>('all');

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  const {
    data: redemptionsData,
    isLoading,
    error,
    refetch
  } = useAllRedemptions({
    page: currentPage,
    per_page: itemsPerPage,
    status: statusFilter !== 'all' ? statusFilter : undefined,

    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchTerm || undefined
  });

  const redemptions = (redemptionsData as any)?.data || [];
  const totalPages = (redemptionsData as any)?.last_page || 1;
  const totalItems = (redemptionsData as any)?.total || 0;

  // Função para obter o ícone do status
  const getStatusIcon = (status: RedemptionStatus) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Função para obter a cor do badge de status
  const getStatusColor = (status: RedemptionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  // Filtrar resgates baseado nos filtros aplicados
  /**
   * Aplica filtros de busca, status e categoria.
   * Normaliza campos para string para evitar erros (ex.: id numérico).
   */
  const filteredRedemptions = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();

    return redemptions.filter((redemption: any) => {
      const idStr = String(redemption?.id ?? '').toLowerCase();
      const userNameStr = String(redemption?.userName ?? '').toLowerCase();
      const userEmailStr = String(redemption?.userEmail ?? '').toLowerCase();
      const productNameStr = String(redemption?.productName ?? '').toLowerCase();
      const categoryStr = String(redemption?.productCategory ?? '').toLowerCase();

      const matchesSearch =
        userNameStr.includes(term) ||
        userEmailStr.includes(term) ||
        productNameStr.includes(term) ||
        idStr.includes(term);

      const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || categoryStr === String(categoryFilter).toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [redemptions, searchTerm, statusFilter, categoryFilter]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = redemptions.length;
    const pending = redemptions.filter(r => r.status === 'pending').length;
    const processing = redemptions.filter(r => r.status === 'processing').length;
    const confirmed = redemptions.filter(r => r.status === 'confirmed').length;
    const shipped = redemptions.filter(r => r.status === 'shipped').length;
    const delivered = redemptions.filter(r => r.status === 'delivered').length;
    const cancelled = redemptions.filter(r => r.status === 'cancelled').length;
    const totalPoints = redemptions.reduce((sum, r) => sum + r.pointsUsed, 0);
    
    return { total, pending, processing, confirmed, shipped, delivered, cancelled, totalPoints };
  }, [redemptions]);

  // Hook para atualizar status do resgate
  /**
   * Mutation para atualizar o status de um resgate.
   * Ao concluir com sucesso, força um refetch da listagem para refletir a mudança imediatamente.
   */
  const updateRedemptionStatusMutation = useUpdateRedemptionStatus({
    onSuccess: () => {
      refetch();
      toast({
        title: "Status atualizado",
        description: "Status do resgate foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error?.message || "Ocorreu um erro ao atualizar o status do resgate.",
        variant: "destructive",
      });
    }
  });

  // Função para atualizar status do resgate
  /**
   * Atualiza o status do resgate.
   * Bloqueia edição se o resgate estiver cancelado ou estornado.
   */
  const handleStatusUpdate = async (redemptionId: string, newStatus: RedemptionStatus) => {
    // Bloqueio de edição para pedidos cancelados ou estornados
    const target = (redemptions as any[]).find((r: any) => r.id === redemptionId);
    if (target && (target.status === 'cancelled' || target.status === 'refunded')) {
      toast({
        title: 'Ação não permitida',
        description: 'Edição de status indisponível para pedidos cancelados ou estornados.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateRedemptionStatusMutation.mutateAsync({
        id: redemptionId,
        status: newStatus as string
      });
    } catch (error) {
      // Erro já tratado no onError da mutation
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Função para visualizar detalhes do resgate
  const handleViewDetails = (redemptionId: string) => {
    navigate(`/admin/redemptions/${redemptionId}`);
  };

  // Função para exportar dados
  const handleExport = () => {
    toast({
      title: "Exportando dados",
      description: "Os dados dos resgates estão sendo exportados...",
    });
  };

  /**
   * Handle pagination page change
   * Manipula a mudança de página na paginação
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Obter categorias únicas para o filtro
  const categories = Array.from(new Set(redemptions.map((r: any) => r.productCategory)));

  /**
   * Reset page to 1 when filters or search change
   * Reseta a página quando filtros ou busca mudarem para evitar páginas vazias
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resgates da Loja de Pontos</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todos os resgates realizados pelos clientes
          </p>
        </div>
        <div className="flex gap-2">
          {/* Botão de impressão visível apenas no modo normal (oculto na impressão via CSS) */}
          <PrintButton className="ml-auto" label="Imprimir resgates" />
        </div>
      </div>

      {/* Filtros (não imprimir) */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nome, email, produto ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(REDEMPTION_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            

            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas - agora abaixo dos filtros */}
      {/* Ajuste de impressão: manter os cards de estatísticas em uma linha na página impressa */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 print-stats-grid-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              <p className="text-sm text-gray-600">Processando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              <p className="text-sm text-gray-600">Confirmados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              <p className="text-sm text-gray-600">Enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              <p className="text-sm text-gray-600">Entregues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-gray-600">Cancelados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalPoints.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Pontos Usados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resgates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Resgates ({filteredRedemptions.length})
          </CardTitle>
          <CardDescription>
            Lista de todos os resgates realizados na loja de pontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead>Entrega</TableHead> */}
                  <TableHead className="text-right print-hidden">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRedemptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">Nenhum resgate encontrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRedemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell className="font-medium">{redemption.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{redemption.userName}</span>
                          <span className="text-sm text-gray-500">{redemption.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={redemption.productImage} 
                            alt={redemption.productName}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{redemption.productName}</span>
                            <span className="text-sm text-gray-500">{redemption.productCategory}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Gift className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">{redemption.pointsUsed.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(redemption.redemptionDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`flex items-center gap-1 w-fit ${getStatusColor(redemption.status)}`}
                        >
                          {getStatusIcon(redemption.status)}
                          {REDEMPTION_STATUSES[redemption.status].label}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>
                        {redemption.estimatedDelivery && (
                          <span className="text-sm">
                            {format(new Date(redemption.estimatedDelivery), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </TableCell> */}
                      <TableCell className="text-right print-hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(redemption.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(redemption.id, 'confirmed')}
                              disabled={updateRedemptionStatusMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirmar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(redemption.id, 'shipped')}
                              disabled={updateRedemptionStatusMutation.isPending}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Marcar como enviado
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(redemption.id, 'delivered')}
                              disabled={updateRedemptionStatusMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como entregue
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(redemption.id, 'cancelled')}
                              disabled={updateRedemptionStatusMutation.isPending || redemption.status === 'cancelled' || redemption.status === 'refunded'}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalItems > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRedemptions;