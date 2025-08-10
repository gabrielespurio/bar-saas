import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import NewSaleModal from "@/components/modals/NewSaleModal";

export default function Sales() {
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const response = await api.get("/sales");
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/sales/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast({
        title: "Status atualizado",
        description: "Status da venda atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da venda",
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

  const filteredSales = sales.filter((sale: any) => {
    if (filterStatus && sale.status !== filterStatus) return false;
    return true;
  });

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
          <h2 className="fw-bold" style={{ color: "#424242" }}>Vendas</h2>
          <p className="text-muted mb-0">Gerenciar vendas e gerar comprovantes</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewSaleModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Nova Venda
        </button>
      </div>

      {/* Sales Filter */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setFilterStatus("")}
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">Lista de Vendas</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm">
              <i className="fas fa-download me-1"></i>Exportar
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredSales.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data/Hora</th>
                    <th>Itens</th>
                    <th>Subtotal</th>
                    <th>Desconto</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale: any) => (
                    <tr key={sale.id}>
                      <td className="fw-medium">#{sale.id.slice(-4)}</td>
                      <td>{new Date(sale.createdAt).toLocaleString('pt-BR')}</td>
                      <td>{sale.itemCount} itens</td>
                      <td>{formatCurrency(sale.subtotal)}</td>
                      <td>{formatCurrency(sale.discount || 0)}</td>
                      <td className="fw-semibold">{formatCurrency(sale.total)}</td>
                      <td>
                        <span className={`badge ${
                          sale.status === 'paid' ? 'bg-success' : 
                          sale.status === 'pending' ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {sale.status === 'paid' ? 'Pago' : 
                           sale.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" title="Ver Detalhes">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-outline-success btn-sm me-1" title="Imprimir Comprovante">
                          <i className="fas fa-print"></i>
                        </button>
                        {sale.status === 'pending' && (
                          <button 
                            className="btn btn-outline-success btn-sm me-1" 
                            title="Marcar como Pago"
                            onClick={() => updateStatusMutation.mutate({ id: sale.id, status: 'paid' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {sale.status !== 'cancelled' && (
                          <button 
                            className="btn btn-outline-danger btn-sm" 
                            title="Cancelar"
                            onClick={() => updateStatusMutation.mutate({ id: sale.id, status: 'cancelled' })}
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
              <i className="fas fa-cash-register fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">Nenhuma venda encontrada</h5>
              <p className="text-muted">Clique em "Nova Venda" para registrar sua primeira venda</p>
            </div>
          )}
        </div>
      </div>

      <NewSaleModal 
        show={showNewSaleModal}
        onHide={() => setShowNewSaleModal(false)}
      />
    </div>
  );
}
