import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Boxes, CheckCircle, AlertTriangle, XCircle, Plus, Search, Trash2, Edit } from "lucide-react";
import NewProductModal from "@/components/modals/NewProductModal";

export default function Inventory() {
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  const getProductStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Sem Estoque', variant: 'destructive' as const, class: 'out-of-stock' };
    if (product.quantity <= product.minStock) return { label: 'Estoque Baixo', variant: 'outline' as const, class: 'low-stock' };
    return { label: 'Em Estoque', variant: 'secondary' as const, class: 'in-stock' };
  };

  const filteredProducts = products.filter((product: Product) => {
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
  const inStock = products.filter((p: Product) => p.quantity > p.minStock).length;
  const lowStock = products.filter((p: Product) => p.quantity <= p.minStock && p.quantity > 0).length;
  const outOfStock = products.filter((p: Product) => p.quantity === 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estoque</h2>
          <p className="text-gray-600">Controle de produtos e quantidades</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowNewProductModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <Boxes className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="text-sm opacity-90">Total de Produtos</div>
          </CardContent>
        </Card>
        <Card className="bg-green-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{inStock}</div>
            <div className="text-sm opacity-90">Em Estoque</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500 text-white border-0">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{lowStock}</div>
            <div className="text-sm opacity-90">Estoque Baixo</div>
          </CardContent>
        </Card>
        <Card className="bg-red-600 text-white border-0">
          <CardContent className="p-6 text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{outOfStock}</div>
            <div className="text-sm opacity-90">Sem Estoque</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Filter and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Produto</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  placeholder="Nome ou código do produto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as Categorias</SelectItem>
                  <SelectItem value="bebidas">Bebidas</SelectItem>
                  <SelectItem value="comidas">Comidas</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="in_stock">Em Estoque</SelectItem>
                  <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
                setStatusFilter("");
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Min. Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => {
                  const status = getProductStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="capitalize">{product.category}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            title="Excluir"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Boxes className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h5 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h5>
              <p className="text-gray-600">Clique em "Novo Produto" para adicionar seu primeiro produto</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewProductModal} onOpenChange={setShowNewProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <NewProductModal 
            isOpen={showNewProductModal}
            onClose={() => setShowNewProductModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
