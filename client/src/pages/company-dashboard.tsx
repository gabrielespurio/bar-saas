import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, ShoppingCart, TrendingUp, LogOut } from "lucide-react";

export default function CompanyDashboard() {
  const { company, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">BarManager</h1>
                <p className="text-sm text-gray-500">{company?.name}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="flex items-center gap-2"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6" data-testid="company-dashboard">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="company-name">
              {company?.name}
            </h1>
            <p className="text-muted-foreground" data-testid="dashboard-subtitle">
              Painel de controle da empresa
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-sales">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vendas Hoje
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação a ontem
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pedidos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação a ontem
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-products">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Produtos cadastrados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Mensal
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  +0% em relação ao mês passado
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="quick-actions">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesse as principais funcionalidades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <button className="flex items-center justify-start gap-2 p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
                    <ShoppingCart className="h-4 w-4" />
                    Nova Venda
                  </button>
                  <button className="flex items-center justify-start gap-2 p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Building2 className="h-4 w-4" />
                    Cadastrar Produto
                  </button>
                  <button className="flex items-center justify-start gap-2 p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Users className="h-4 w-4" />
                    Gerenciar Estoque
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="recent-activity">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas movimentações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma atividade recente</p>
                  <p className="text-sm mt-2">
                    As últimas vendas e movimentações aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}