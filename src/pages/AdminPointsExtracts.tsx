import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Plus,
  Minus,
  Gift,
  Calendar,
  User,
  DollarSign,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrintButton } from '@/components/ui/PrintButton';
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
import { 
  PointsExtract, 
  PointsTransactionType,
  POINTS_TRANSACTION_TYPES 
} from '@/types/redemptions';
import { 
  usePointsExtracts, 
  usePointsExtractStats, 
  useCreateAdjustment, 
  useExportPointsExtracts 
} from '@/hooks/pointsExtracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '@/styles/print.css';

// Removido dados mockados - agora usando dados da API

/**
 * Página administrativa para acompanhamento de extratos de pontos
 * Permite visualizar, filtrar e gerenciar todas as movimentações de pontos
 */
const AdminPointsExtracts: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);

  // Parâmetros para a API
  const apiParams = {
    page: currentPage,
    per_page: perPage,
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? (typeFilter as PointsTransactionType) : undefined,
    dateFrom: dateFromFilter || undefined,
    dateTo: dateToFilter || undefined,
    sort: 'createdAt',
    order: 'desc' as const
  };

  // Hooks da API
  const { data: extractsResponse, isLoading, error, refetch } = usePointsExtracts(apiParams);
  // Params específicos para estatísticas (somente filtros relevantes)
  const statsParams = {
    search: apiParams.search,
    type: apiParams.type,
    dateFrom: apiParams.dateFrom,
    dateTo: apiParams.dateTo,
  };
  const { data: stats, isLoading: isLoadingStats } = usePointsExtractStats(statsParams);
  const createAdjustmentMutation = useCreateAdjustment();
  const exportMutation = useExportPointsExtracts();
  // console.log('extractsResponse',extractsResponse);
  const extracts = extractsResponse?.data || [];
  // console.log('extracts',extracts);
  const pagination = {
    current_page: extractsResponse?.current_page || 1,
    last_page: extractsResponse?.last_page || 1,
    per_page: extractsResponse?.per_page || perPage,
    total: extractsResponse?.total || 0
  };

  // Função para obter o ícone do tipo de transação
  const getTransactionIcon = (type: PointsTransactionType) => {
    // console.log('type',type);
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-purple-600" />;
      case 'redeemed':
        return <TrendingDown className="w-4 h-4 text-blue-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'refund':
        return <CheckCircle className="w-4 h-4 text-orange-600" />;
      case 'adjustment':
        return <DollarSign className="w-4 h-4 text-gray-600" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  // Função para obter a cor do badge do tipo
  const getTypeColor = (type: PointsTransactionType) => {
    switch (type) {
      case 'earned':
      case 'bonus':
        return 'default';
      case 'redeemed':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'refund':
        return 'outline';
      case 'adjustment':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  const getTransactionLabel = (type: PointsTransactionType) => {
    switch (type) {
      case 'earned':
        return 'Pontos ganhos';
      case 'bonus':
        return 'Bônus';
      case 'redeemed':
        return 'Pontos resgatados';
      case 'expired':
        return 'Pontos expirados';
      case 'refund':
        return 'Reembolso';
      case 'adjustment':
        return 'Ajuste manual';
      default:
        return type;
    }
  };

  // Função para aplicar filtros (resetar página)
  const applyFilters = () => {
    setCurrentPage(1);
  };

  // Aplicar filtros quando mudarem
  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, typeFilter, dateFromFilter, dateToFilter]);

  // Função para visualizar detalhes do extrato
  const handleViewDetails = (extractId: string) => {
    navigate(`/admin/points-extracts/${extractId}`);
  };

  // Função para exportar dados
  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extratos-pontos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Exportação concluída",
        description: "Os dados dos extratos foram exportados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive"
      });
    }
  };

  // Função para criar ajuste manual
  const handleCreateAdjustment = () => {
    // TODO: Implementar modal/formulário para criar ajuste
    toast({
      title: "Criar ajuste",
      description: "Funcionalidade em desenvolvimento...",
    });
  };

  // Função para atualizar dados
  const handleRefresh = () => {
    refetch();
  };

  /**
   * Gera uma legenda textual com os filtros aplicados
   * pt-BR: Monta um texto compacto com tipo, período e busca.
   * en-US: Builds a compact text with type, period and search.
   */
  const buildFilterLegend = (
    typeValue: string,
    searchValue: string,
    dateFrom?: string,
    dateTo?: string,
  ): string => {
    const parts: string[] = [];

    // Tipo de transação
    if (typeValue && typeValue !== 'all') {
      const typeLabel = POINTS_TRANSACTION_TYPES[typeValue as keyof typeof POINTS_TRANSACTION_TYPES]?.label || typeValue;
      parts.push(`Tipo: ${typeLabel}`);
    }

    // Período de datas
    if (dateFrom && dateTo) {
      parts.push(`Período: ${format(new Date(dateFrom), 'dd/MM/yyyy')} a ${format(new Date(dateTo), 'dd/MM/yyyy')}`);
    } else if (dateFrom) {
      parts.push(`Período: a partir de ${format(new Date(dateFrom), 'dd/MM/yyyy')}`);
    } else if (dateTo) {
      parts.push(`Período: até ${format(new Date(dateTo), 'dd/MM/yyyy')}`);
    }

    // Busca
    if (searchValue && searchValue.trim().length > 0) {
      parts.push(`Busca: "${searchValue.trim()}"`);
    }

    return parts.join(' | ');
  };

  const filterLegend = buildFilterLegend(typeFilter, searchTerm, dateFromFilter, dateToFilter);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center justify-between gap-3">
  <h1 className="text-3xl font-bold tracking-tight">Extratos de Pontos</h1>
</div>
          <p className="text-muted-foreground">
            Acompanhe todas as movimentações de pontos dos clientes
          </p>
        </div>
        {/* Área de ações à direita (inclui botão de impressão) */}
        <div className="flex gap-2 items-center justify-end w-full sm:w-auto">
          {/* Botão de imprimir extratos alinhado à direita */}
          <PrintButton className="ml-auto" label="Imprimir extratos" />
          {/* <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button> */}
          {/* <Button variant="outline" onClick={handleCreateAdjustment}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Ajuste
          </Button> */}
          {/* <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button> */}
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
                  placeholder="Nome, email, descrição ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Transação</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(POINTS_TRANSACTION_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda dos filtros aplicada (visível na impressão se houver filtros) */}
      {filterLegend && (
        <div className="text-sm text-gray-600">
          Filtros aplicados: {filterLegend}
        </div>
      )}

      {/* Estatísticas - movidas abaixo dos filtros e refletindo filtros */}
      {isLoadingStats ? (
        // Ajuste de impressão: manter os cards de estatísticas em linha na página impressa
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 print-stats-grid">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        // Ajuste de impressão: manter os cards de estatísticas em linha na página impressa
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 print-stats-grid">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Transações</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalEarned.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Pontos Ganhos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalRedeemed.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Pontos Resgatados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.totalExpired.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Pontos Expirados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Erro ao carregar estatísticas
        </div>
      )}

      {/* Tabela de Extratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Extratos de Pontos ({extracts.length})
          </CardTitle>
          <CardDescription>
            Histórico completo de movimentações de pontos dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Saldo Anterior</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right print-hidden">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-8 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : extracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">Nenhuma movimentação encontrada</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  extracts.map((extract) => (
                    <TableRow key={extract.id}>
                      <TableCell className="font-medium">{extract.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{extract.userName}</span>
                          <span className="text-sm text-gray-500">{extract.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(extract.type)} className="flex items-center gap-1 w-fit">
                          {getTransactionIcon(extract.type)}
                          {getTransactionLabel(extract.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-medium ${
                          extract.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {extract.points > 0 ? (
                            <Plus className="w-4 h-4" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                          {Math.abs(extract.points).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate" title={extract.description}>
                            {extract.description.replace(/Resgate de produto: /, 'Resgate de: ')}
                          </p>
                          {extract.reference && (
                            <p className="text-xs text-gray-500">Ref: {extract.reference}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {extract.balanceBefore ? extract.balanceBefore.toLocaleString() : '0'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {extract.balanceAfter ? extract.balanceAfter.toLocaleString() : '0'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {extract.createdAt ? format(new Date(extract.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data não disponível'}
                          </span>
                        </div>
                        {extract.expirationDate && (
                          <div className="text-xs text-gray-500">
                            Expira: {extract.expirationDate ? format(new Date(extract.expirationDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Data não disponível'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right print-hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(extract.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            {/* {extract.reference && (
                              <DropdownMenuItem onClick={() => {
                                if (extract.reference?.startsWith('R')) {
                                  toast({
                                    title: "Navegar para resgate",
                                    description: `Abrindo resgate ${extract.reference}`,
                                  });
                                } else if (extract.reference?.startsWith('ORDER')) {
                                  toast({
                                    title: "Navegar para pedido",
                                    description: `Abrindo pedido ${extract.reference}`,
                                  });
                                }
                              }}>
                                <User className="mr-2 h-4 w-4" />
                                Ver referência
                              </DropdownMenuItem>
                            )} */}
                            {extract.createdBy && (
                              <DropdownMenuItem disabled>
                                <User className="mr-2 h-4 w-4" />
                                Criado por: {extract.createdBy}
                              </DropdownMenuItem>
                            )}
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
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de {pagination.total} resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pageNumber = i + 1;
                    const isCurrentPage = pageNumber === currentPage;
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= pagination.total_pages || isLoading}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPointsExtracts;