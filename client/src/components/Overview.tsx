import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  dailySales: string;
  orders: number;
  products: number;
  monthlyRevenue: string;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalReceivable: string;
  totalPayable: string;
}

export default function Overview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
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

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const recentSales = sales.slice(0, 5);

  return (
    <div className="p-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#424242" }}>Visão Geral</h2>
          <p className="text-muted mb-0">Dashboard principal do sistema</p>
        </div>
        <div className="text-muted">
          <small>Última atualização: {new Date().toLocaleString('pt-BR')}</small>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-dollar-sign text-primary fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Vendas Hoje</h6>
                  <h4 className="fw-bold mb-0">{formatCurrency(stats?.dailySales || "0")}</h4>
                  <small className="text-success"><i className="fas fa-arrow-up"></i> +12%</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-receipt text-success fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Pedidos</h6>
                  <h4 className="fw-bold mb-0">{stats?.orders || 0}</h4>
                  <small className="text-success"><i className="fas fa-arrow-up"></i> +8%</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-boxes text-warning fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Produtos</h6>
                  <h4 className="fw-bold mb-0">{stats?.products || 0}</h4>
                  {stats && stats.lowStockProducts > 0 && (
                    <small className="text-warning">
                      <i className="fas fa-exclamation-triangle"></i> {stats.lowStockProducts} em falta
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="fas fa-chart-line text-info fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Receita Mensal</h6>
                  <h4 className="fw-bold mb-0">{formatCurrency(stats?.monthlyRevenue || "0")}</h4>
                  <small className="text-success"><i className="fas fa-arrow-up"></i> +15%</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">Vendas Recentes</h5>
            </div>
            <div className="card-body p-0">
              {recentSales.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Horário</th>
                        <th>Itens</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale: any) => (
                        <tr key={sale.id}>
                          <td>#{sale.id.slice(-4)}</td>
                          <td>{new Date(sale.createdAt).toLocaleTimeString('pt-BR')}</td>
                          <td>{sale.itemCount} itens</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Nenhuma venda encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">Alertas de Estoque</h5>
            </div>
            <div className="card-body">
              {stats && (stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) ? (
                <>
                  {stats.outOfStockProducts > 0 && (
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-danger bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="fas fa-times-circle text-danger"></i>
                      </div>
                      <div className="flex-1">
                        <p className="mb-1 fw-medium">{stats.outOfStockProducts} produtos sem estoque</p>
                        <small className="text-muted">Reposição urgente necessária</small>
                      </div>
                    </div>
                  )}
                  {stats.lowStockProducts > 0 && (
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="fas fa-exclamation-triangle text-warning"></i>
                      </div>
                      <div className="flex-1">
                        <p className="mb-1 fw-medium">{stats.lowStockProducts} produtos com estoque baixo</p>
                        <small className="text-muted">Considere fazer reposição</small>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                  <p className="text-success fw-medium">Estoque em ordem!</p>
                  <small className="text-muted">Todos os produtos têm estoque adequado</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
