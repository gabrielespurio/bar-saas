import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewPurchaseModal({ isOpen, onClose }: NewPurchaseModalProps) {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1, unitPrice: 0 }]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await api.get("/suppliers");
      return response.data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products");
      return response.data;
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/purchases", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast({
        title: "Compra criada",
        description: "Compra criada com sucesso",
      });
      onClose();
      setSupplierId("");
      setItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar compra",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à compra",
        variant: "destructive",
      });
      return;
    }

    if (!supplierId) {
      toast({
        title: "Erro",
        description: "Selecione um fornecedor",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal();

    createPurchaseMutation.mutate({
      supplierId,
      total,
      items: validItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }))
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Nova Compra</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fornecedor
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Itens da Compra</h4>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
              >
                + Adicionar Item
              </button>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 p-3 border rounded-md">
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    placeholder="Qtd"
                    required
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    placeholder="Preço"
                    required
                  />
                </div>
                <div className="w-24 text-sm py-1">
                  R$ {(item.quantity * item.unitPrice).toFixed(2)}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total: R$ {calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createPurchaseMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createPurchaseMutation.isPending ? "Criando..." : "Criar Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}