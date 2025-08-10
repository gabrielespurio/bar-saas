import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import NewProductModal from "@/components/modals/NewProductModal";

export default function Inventory() {
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products");
      return response.data;
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir produto",
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

  const getProductStatus = (product: any) => {
    if (product.quantity === 0) return { label: 'Sem Estoque', class: 'out-of-stock' };
    if (product.quantity <= product.minStock) return { label: 'Estoque Baixo', class: 'low-stock' };
    return { label: 'Em Estoque', class: 'in-stock' };
  };

  const filteredProducts = products.filter((product: any) => {
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !product.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (categoryFilter && product.category !== categoryFilter) return false;
    if (statusFilter) {
      const status = getProductStatus(product);
      if (statusFilter === 'in_stock' && status.class !== 'in-stock') return false;
      if (statusFilter === 'low_stock' && status.class !== 'low-stock') return false;
      if (statusFilter === 'out_of_stock' && status.class !== 'out-of-stock') return false;
    }
    return true;
  });

  const totalProducts = products.length;
  const inStock = products.filter((p: any) => p.quantity > p.minStock).length;
  const lowStock = products.filter((p: any) => p.quantity <= p.minStock && p.quantity > 0).length;
  const outOfStock = products.filter((p: any) => p.quantity === 0).length;

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
          <h2 className="fw-bold" style={{ color: "#424242" }}>Estoque</h2>
          <p className="text-muted mb-0">Controle de produtos e quantidades</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewProductModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Novo Produto
        </button>
      </div>

      {/* Inventory Stats */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <i className="fas fa-boxes fa-2x mb-2"></i>
              <h4 className="mb-1">{totalProducts}</h4>
              <small>Total de Produtos</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <i className="fas fa-check-circle fa-2x mb-2"></i>
              <h4 className="mb-1">{inStock}</h4>
              <small>Em Estoque</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-2"></i>
              <h4 className="mb-1">{lowStock}</h4>
              <small>Estoque Baixo</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <i className="fas fa-times-circle fa-2x mb-2"></i>
              <h4 className="mb-1">{outOfStock}</h4>
              <small>Sem Estoque</small>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Filter and Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-4">
              <label className="form-label">Buscar Produto</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nome ou código do produto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Categoria</label>
              <select 
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas as Categorias</option>
                <option value="bebidas">Bebidas</option>
                <option value="comidas">Comidas</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="in_stock">Em Estoque</option>
                <option value="low_stock">Estoque Baixo</option>
                <option value="out_of_stock">Sem Estoque</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("");
                  setStatusFilter("");
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0 fw-semibold">Produtos em Estoque</h5>
        </div>
        <div className="card-body p-0">
          {filteredProducts.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Quantidade</th>
                    <th>Min. Estoque</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product: any) => {
                    const status = getProductStatus(product);
                    return (
                      <tr key={product.id}>
                        <td className="fw-medium">{product.code}</td>
                        <td>{product.name}</td>
                        <td className="text-capitalize">{product.category}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>{product.quantity}</td>
                        <td>{product.minStock}</td>
                        <td>
                          <span className={`status-badge ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline-primary btn-sm me-1" title="Editar">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-outline-success btn-sm me-1" title="Ajustar Estoque">
                            <i className="fas fa-plus-minus"></i>
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm" 
                            title="Excluir"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-boxes fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">Nenhum produto encontrado</h5>
              <p className="text-muted">Clique em "Novo Produto" para adicionar seu primeiro produto</p>
            </div>
          )}
        </div>
      </div>

      <NewProductModal 
        show={showNewProductModal}
        onHide={() => setShowNewProductModal(false)}
      />
    </div>
  );
}
