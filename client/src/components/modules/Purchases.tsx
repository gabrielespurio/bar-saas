import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import NewPurchaseModal from "@/components/modals/NewPurchaseModal";

export default function Purchases() {
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const response = await api.get("/purchases");
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/purchases/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Status atualizado",
        description: "Status da compra atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da compra",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const totalThisMonth = purchases
    .filter((purchase: any) => {
      const purchaseDate = new Date(purchase.createdAt);
      const now = new Date();
      return purchaseDate.getMonth() === now.getMonth() && 
             purchaseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, purchase: any) => sum + parseFloat(purchase.total), 0);

  const deliveredCount = purchases.filter((p: any) => p.status === 'delivered').length;
  const pendingCount = purchases.filter((p: any) => p.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#424242" }}>Compras</h2>
          <p className="text-muted mb-0">Registro de compras e controle de fornecedores</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewPurchaseModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Nova Compra
        </button>
      </div>

      {/* Purchase Stats */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <i className="fas fa-shopping-cart fa-2x text-primary mb-2"></i>
              <h4 className="fw-bold mb-1">{formatCurrency(totalThisMonth)}</h4>
              <small className="text-muted">Compras este mês</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <i className="fas fa-truck fa-2x text-success mb-2"></i>
              <h4 className="fw-bold mb-1">{deliveredCount}</h4>
              <small className="text-muted">Entregas realizadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <i className="fas fa-clock fa-2x text-warning mb-2"></i>
              <h4 className="fw-bold mb-1">{pendingCount}</h4>
              <small className="text-muted">Aguardando entrega</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <i className="fas fa-users fa-2x text-info mb-2"></i>
              <h4 className="fw-bold mb-1">{purchases.length}</h4>
              <small className="text-muted">Total de compras</small>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0 fw-semibold">Histórico de Compras</h5>
        </div>
        <div className="card-body p-0">
          {purchases.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Fornecedor</th>
                    <th>Produtos</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase: any) => (
                    <tr key={purchase.id}>
                      <td className="fw-medium">#{purchase.id.slice(-4)}</td>
                      <td>{new Date(purchase.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>{purchase.supplier?.name || 'N/A'}</td>
                      <td>{purchase.itemCount} produtos</td>
                      <td className="fw-semibold">{formatCurrency(purchase.total)}</td>
                      <td>
                        <span className={`badge ${
                          purchase.status === 'delivered' ? 'bg-success' : 
                          purchase.status === 'pending' ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {purchase.status === 'delivered' ? 'Entregue' : 
                           purchase.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" title="Ver Detalhes">
                          <i className="fas fa-eye"></i>
                        </button>
                        {purchase.status === 'pending' && (
                          <button 
                            className="btn btn-outline-success btn-sm me-1" 
                            title="Confirmar Entrega"
                            onClick={() => updateStatusMutation.mutate({ id: purchase.id, status: 'delivered' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {purchase.status !== 'cancelled' && (
                          <button 
                            className="btn btn-outline-danger btn-sm" 
                            title="Cancelar"
                            onClick={() => updateStatusMutation.mutate({ id: purchase.id, status: 'cancelled' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">Nenhuma compra encontrada</h5>
              <p className="text-muted">Clique em "Nova Compra" para registrar sua primeira compra</p>
            </div>
          )}
        </div>
      </div>

      <NewPurchaseModal 
        show={showNewPurchaseModal}
        onHide={() => setShowNewPurchaseModal(false)}
      />
    </div>
  );
}
