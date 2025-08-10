import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Financial() {
  const [activeTab, setActiveTab] = useState("receivable");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  const { data: receivables = [] } = useQuery({
    queryKey: ["accounts-receivable"],
    queryFn: async () => {
      const response = await api.get("/accounts-receivable");
      return response.data;
    },
  });

  const { data: payables = [] } = useQuery({
    queryKey: ["accounts-payable"],
    queryFn: async () => {
      const response = await api.get("/accounts-payable");
      return response.data;
    },
  });

  const updateReceivableStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/accounts-receivable/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      toast({
        title: "Status atualizado",
        description: "Status da conta a receber atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da conta a receber",
        variant: "destructive",
      });
    },
  });

  const updatePayableStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/accounts-payable/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
      toast({
        title: "Status atualizado",
        description: "Status da conta a pagar atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da conta a pagar",
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

  return (
    <div className="p-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#424242" }}>Financeiro</h2>
          <p className="text-muted mb-0">Controle financeiro e relatórios</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success">
            <i className="fas fa-plus me-2"></i>A Receber
          </button>
          <button className="btn btn-danger">
            <i className="fas fa-plus me-2"></i>A Pagar
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-arrow-down text-success fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total a Receber</h6>
                  <h4 className="fw-bold mb-0 text-success">
                    {formatCurrency(stats?.totalReceivable || "0")}
                  </h4>
                  <small className="text-muted">Este mês</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-start border-danger border-4">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-arrow-up text-danger fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total a Pagar</h6>
                  <h4 className="fw-bold mb-0 text-danger">
                    {formatCurrency(stats?.totalPayable || "0")}
                  </h4>
                  <small className="text-muted">Este mês</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-wallet text-primary fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Saldo Atual</h6>
                  <h4 className="fw-bold mb-0 text-primary">
                    {formatCurrency(
                      parseFloat(stats?.totalReceivable || "0") - parseFloat(stats?.totalPayable || "0")
                    )}
                  </h4>
                  <small className="text-success"><i className="fas fa-arrow-up"></i> +1.2%</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0 fw-semibold">Fluxo de Caixa - Últimos 30 dias</h5>
        </div>
        <div className="card-body">
          <div className="bg-light rounded p-4 text-center" style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div>
              <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
              <p className="text-muted">Gráfico de Fluxo de Caixa será implementado aqui</p>
              <small className="text-muted">Usar Chart.js para visualização dos dados</small>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Tabs */}
      <div className="card">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link fw-medium ${activeTab === 'receivable' ? 'active' : ''}`}
                onClick={() => setActiveTab('receivable')}
                type="button"
              >
                Contas a Receber
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link fw-medium ${activeTab === 'payable' ? 'active' : ''}`}
                onClick={() => setActiveTab('payable')}
                type="button"
              >
                Contas a Pagar
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body p-0">
          <div className="tab-content">
            {/* Accounts Receivable Tab */}
            {activeTab === 'receivable' && (
              <div className="tab-pane fade show active">
                {receivables.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Vencimento</th>
                          <th>Valor</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivables.map((item: any) => (
                          <tr key={item.id}>
                            <td>{item.description}</td>
                            <td>{new Date(item.dueDate).toLocaleDateString('pt-BR')}</td>
                            <td className="fw-semibold">{formatCurrency(item.amount)}</td>
                            <td>
                              <span className={`badge ${
                                item.status === 'paid' ? 'bg-success' : 
                                item.status === 'overdue' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {item.status === 'paid' ? 'Pago' : 
                                 item.status === 'overdue' ? 'Vencido' : 'Pendente'}
                              </span>
                            </td>
                            <td>
                              {item.status === 'pending' && (
                                <button 
                                  className="btn btn-success btn-sm me-1" 
                                  title="Marcar como Recebido"
                                  onClick={() => updateReceivableStatusMutation.mutate({ id: item.id, status: 'paid' })}
                                  disabled={updateReceivableStatusMutation.isPending}
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              <button className="btn btn-outline-primary btn-sm me-1" title="Editar">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-outline-danger btn-sm" title="Cancelar">
                                <i className="fas fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Nenhuma conta a receber encontrada</h5>
                    <p className="text-muted">Clique em "A Receber" para adicionar uma nova conta</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Accounts Payable Tab */}
            {activeTab === 'payable' && (
              <div className="tab-pane fade show active">
                {payables.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Vencimento</th>
                          <th>Valor</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payables.map((item: any) => (
                          <tr key={item.id}>
                            <td>{item.description}</td>
                            <td>{new Date(item.dueDate).toLocaleDateString('pt-BR')}</td>
                            <td className="fw-semibold">{formatCurrency(item.amount)}</td>
                            <td>
                              <span className={`badge ${
                                item.status === 'paid' ? 'bg-success' : 
                                item.status === 'overdue' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {item.status === 'paid' ? 'Pago' : 
                                 item.status === 'overdue' ? 'Vencido' : 'Pendente'}
                              </span>
                            </td>
                            <td>
                              {item.status === 'pending' && (
                                <button 
                                  className="btn btn-success btn-sm me-1" 
                                  title="Marcar como Pago"
                                  onClick={() => updatePayableStatusMutation.mutate({ id: item.id, status: 'paid' })}
                                  disabled={updatePayableStatusMutation.isPending}
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              <button className="btn btn-outline-primary btn-sm me-1" title="Editar">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-outline-danger btn-sm" title="Cancelar">
                                <i className="fas fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-credit-card fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Nenhuma conta a pagar encontrada</h5>
                    <p className="text-muted">Clique em "A Pagar" para adicionar uma nova conta</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
