import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Edit, 
  MessageSquare, 
  Download, 
  RefreshCw,
  Star,
  Gift,
  DollarSign,
  Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useRedemption, useUpdateRedemptionStatus } from '@/hooks/redemptions';
import { useRefundRedemption, useDeleteRedemption } from '@/hooks/redemptions';
import { 
  Redemption, 
  RedemptionStatus,
  StatusHistory,
  REDEMPTION_STATUSES
} from '@/types/redemptions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Dados mockados removidos - agora usando dados da API

/**
 * Página de detalhes de um resgate específico
 * Exibe informações completas do pedido, histórico e permite ações administrativas
 */
const AdminRedemptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [newStatus, setNewStatus] = useState<RedemptionStatus>('processing');
  const [statusComment, setStatusComment] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  
  // Hook para buscar dados do resgate
  const { data: redemption, isLoading, error } = useRedemption(id || '', {
    enabled: !!id
  }) as { data: Redemption | undefined, isLoading: boolean, error: any };
  // console.log('redemption',redemption);
  // Hook para atualizar status do resgate
  const updateRedemptionStatusMutation = useUpdateRedemptionStatus({
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "Status do resgate foi atualizado com sucesso.",
      });
      setStatusComment('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error?.message || "Ocorreu um erro ao atualizar o status do resgate.",
        variant: "destructive",
      });
    }
  });

  // Mutation para extornar resgate
  const refundMutation = useRefundRedemption({
    onSuccess: () => {
      toast({
        title: 'Resgate extornado',
        description: 'O pedido de resgate foi extornado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao extornar',
        description: error?.message || 'Ocorreu um erro ao extornar o resgate.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir resgate
  const deleteRedemptionMutation = useDeleteRedemption({
    onSuccess: () => {
      toast({
        title: 'Resgate excluído',
        description: 'O resgate foi excluído com sucesso.',
      });
      navigate('/admin/redemptions');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir',
        description: error?.message || 'Não foi possível excluir o resgate.',
        variant: 'destructive',
      });
    },
  });

  /**
   * Extorna o resgate atual
   * Envia o ID do resgate para API e atualiza a UI
   */
  const handleRefund = () => {
    if (!id) return;
    const confirmed = window.confirm('Confirmar extorno deste resgate?');
    if (!confirmed) return;
    refundMutation.mutate({ id: id! });
  };

  /**
   * Exclui o resgate atual
   * Confirma com o usuário e executa a mutação de exclusão.
   */
  const handleDeleteRedemption = async () => {
    if (!id) return;
    const confirmed = window.confirm('Tem certeza que deseja excluir este resgate? Esta ação é permanente.');
    if (!confirmed) return;
    await deleteRedemptionMutation.mutateAsync(id!);
  };
  // Atualizar status inicial quando os dados carregarem
  useEffect(() => {
    if (redemption) {
      setNewStatus(redemption.status);
      setTrackingCode(redemption.trackingCode || '');
      // Usar histórico de status da API
      setStatusHistory(redemption.statusHistory || []);
    }
  }, [redemption]);

  // Função para obter o ícone do status
  const getStatusIcon = (status: RedemptionStatus) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Package className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Função para obter a cor do status
  const getStatusColor = (status: RedemptionStatus) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  // Função para atualizar status
  /**
   * Atualiza o status do resgate.
   * - Usa `newStatus` (state) como status selecionado.
   * - Envia `notes` e `trackingCode` junto com o ID.
   * - Bloqueia edição se o resgate estiver cancelado ou estornado.
   */
  const handleUpdateStatus = async () => {
    // Bloqueio de edição para pedidos cancelados ou estornados
    if (redemption && (redemption.status === 'cancelled' || redemption.status === 'refunded')) {
      toast({
        title: 'Ação não permitida',
        description: 'Edição de status indisponível para pedidos cancelados ou estornados.',
        variant: 'destructive'
      });
      return;
    }

    if (!redemption) {
      toast({
        title: 'Resgate não carregado',
        description: 'Não foi possível identificar o resgate para atualização.',
        variant: 'destructive'
      });
      return;
    }

    if (!statusComment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Adicione um comentário para registrar a atualização de status.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await updateRedemptionStatusMutation.mutateAsync({
        id: redemption.id,
        status: newStatus,
        notes: statusComment,
        trackingCode: trackingCode || undefined,
      });
      setStatusComment('');
      toast({
        title: 'Status atualizado',
        description: 'O status foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Função para voltar à lista
  const handleGoBack = () => {
    navigate('/admin/redemptions');
  };

  // Função para baixar comprovante
  const handleDownloadReceipt = () => {
    toast({
      title: "Download iniciado",
      description: "O comprovante está sendo gerado..."
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Carregando detalhes do resgate...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar resgate</h3>
          <p className="text-gray-600">Não foi possível carregar os detalhes do resgate.</p>
        </div>
        <Button onClick={() => navigate('/admin/redemptions')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à lista
        </Button>
      </div>
    );
  }

  if (!redemption) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Resgate não encontrado</h2>
            <p className="text-gray-600 text-center">
              O resgate com ID "{id}" não foi encontrado ou você não tem permissão para visualizá-lo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resgate #{redemption.id}</h1>
            <p className="text-muted-foreground">
              Criado em {format(new Date(redemption.createdAt), 'dd/MM/yyyy \\à\\s HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           {/* Botão de Extorno */}
           {redemption.status !== 'refunded' && (
             <Button 
               variant="destructive" 
               onClick={handleRefund}
               disabled={refundMutation.isPending || redemption.status === 'cancelled'}
               title={redemption.status === 'cancelled' ? 'Estorno indisponível para pedidos cancelados' : undefined}
             >
               {refundMutation.isPending ? (
                 <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <XCircle className="w-4 h-4 mr-2" />
               )}
               {refundMutation.isPending ? 'Estornando...' : 'Estornar'}
             </Button>
           )}
           {/* Botão de Exclusão */}
           <Button
             variant="destructive"
             onClick={handleDeleteRedemption}
             disabled={deleteRedemptionMutation.isPending}
             title="Excluir definitivamente este resgate"
           >
             {deleteRedemptionMutation.isPending ? (
               <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
             ) : (
               <Trash className="w-4 h-4 mr-2" />
             )}
             {deleteRedemptionMutation.isPending ? 'Excluindo...' : 'Excluir'}
           </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produto Resgatado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <img 
                  src={redemption.productImage} 
                  alt={redemption.productName}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{redemption.productName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{redemption.productCategory}</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      {redemption.pointsUsed.toLocaleString()} pontos
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Dados Pessoais</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{redemption.userName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{redemption.userEmail}</span>
                    </div>
                    {redemption.userPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{redemption.userPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {redemption.shippingAddress && (
                  <div>
                    <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="text-sm">
                        <p>{redemption.shippingAddress.street}</p>
                        {redemption.shippingAddress.complement && (
                          <p>{redemption.shippingAddress.complement}</p>
                        )}
                        <p>{redemption.shippingAddress.neighborhood}</p>
                        <p>{redemption.shippingAddress.city} - {redemption.shippingAddress.state}</p>
                        <p>CEP: {redemption.shippingAddress.zipCode}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Histórico de Status
              </CardTitle>
              <CardDescription>
                Acompanhe todas as atualizações do pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusHistory.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${getStatusColor(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                      </div>
                      {index < statusHistory.length - 1 && (
                        <div className="w-px h-8 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(entry.status)}>
                          {REDEMPTION_STATUSES[entry.status].label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{entry.comment}</p>
                      <p className="text-xs text-gray-500">Por: {entry.createdByName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(redemption.status)}>
                    {getStatusIcon(redemption.status)}
                    <span className="ml-1">{REDEMPTION_STATUSES[redemption.status].label}</span>
                  </Badge>
                </div>
                

                
                {redemption.trackingCode && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Código de Rastreamento:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {redemption.trackingCode}
                      </code>
                      <Button size="sm" variant="outline">
                        <Truck className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {redemption.estimatedDelivery && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Previsão de Entrega:</span>
                    <p className="text-sm">
                      {format(new Date(redemption.estimatedDelivery), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Atualizar Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Atualizar Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Novo Status</label>
                  <Select value={newStatus} onValueChange={(value: RedemptionStatus) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REDEMPTION_STATUSES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(key as RedemptionStatus)}
                            {value.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código de Rastreamento</label>
                  <input
                    type="text"
                    placeholder="Digite o código de rastreamento..."
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comentário *</label>
                  <Textarea
                    placeholder="Descreva a atualização do status..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleUpdateStatus} 
                  disabled={updateRedemptionStatusMutation.isPending || !statusComment.trim()}
                  className="w-full"
                >
                  {updateRedemptionStatusMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {updateRedemptionStatusMutation.isPending ? 'Atualizando...' : 'Atualizar Status'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {redemption.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{redemption.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRedemptionDetails;