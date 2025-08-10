import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";

export default function Overview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  const { data: recentSales } = useQuery({
    queryKey: ["sales", "recent"],
    queryFn: async () => {
      const response = await api.get("/sales");
      return response.data.slice(0, 5);
    },
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="d-flex align-items-center justify-content-center" style={{ height: "400px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3 text-muted">Carregando dados...</p>
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

  return (
    <div className="p-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#424242" }}>
            Visão Geral
          </h2>
          <p className="text-muted mb-0">Dashboard principal do sistema</p>
        </div>
        <div className="text-muted">
          <small>
            Última atualização:{" "}
            <span>{new Date().toLocaleString("pt-BR")}</span>
          </small>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <StatCard
            icon="fas fa-dollar-sign"
            iconColor="primary"
            title="Vendas Hoje"
            value={formatCurrency(stats?.dailySales || "0")}
            trend="up"
            trendValue="12%"
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            icon="fas fa-receipt"
            iconColor="success"
            title="Pedidos"
            value={stats?.orders || 0}
            trend="up"
            trendValue="8%"
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            icon="fas fa-boxes"
            iconColor="warning"
            title="Produtos"
            value={stats?.products || 0}
            subtitle={`${stats?.lowStockProducts || 0} em falta`}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            icon="fas fa-chart-line"
            iconColor="info"
            title="Receita Mensal"
            value={formatCurrency(stats?.monthlyRevenue || "0")}
            trend="up"
            trendValue="15%"
          />
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-semibold">Vendas Recentes</h5>
            </div>
            <div className="card-body p-0">
              {recentSales && recentSales.length > 0 ? (
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
