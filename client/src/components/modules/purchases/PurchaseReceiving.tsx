import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const receivingSchema = z.object({
  deliveredDate: z.string().min(1, "Data de entrega é obrigatória"),
  notes: z.string().optional(),
});

type ReceivingForm = z.infer<typeof receivingSchema>;

export default function PurchaseReceiving() {
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReceivingForm>({
    resolver: zodResolver(receivingSchema),
    defaultValues: {
      deliveredDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const { data: pendingOrders = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const response = await api.get("/purchases");
      return response.data;
    },
  });

  const receiveOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: ReceivingForm }) => {
      const response = await api.patch(`/purchases/${orderId}/status`, {
        status: "delivered",
        deliveredDate: data.deliveredDate,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowReceiveModal(false);
      setSelectedOrder(null);
      form.reset();
      toast({
        title: "Recebimento registrado",
        description: "Recebimento da compra registrado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar recebimento da compra",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReceivingForm) => {
    if (selectedOrder) {
      receiveOrderMutation.mutate({ orderId: selectedOrder.id, data });
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Aguardando", variant: "outline" as const, icon: Clock },
      delivered: { label: "Recebido", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: AlertCircle },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const isOverdue = (order: any) => {
    if (!order.expectedDeliveryDate || order.status !== 'pending') return false;
    return new Date(order.expectedDeliveryDate) < new Date();
  };

  const pendingReceiving = pendingOrders.filter((order: any) => order.status === 'pending');
  const completedReceiving = pendingOrders.filter((order: any) => order.status === 'delivered');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="purchase-receiving">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recebimentos</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {pendingReceiving.length} aguardando
          </Badge>
          <Badge variant="default" className="text-sm">
            {completedReceiving.length} recebidos
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReceiving.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando recebimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedReceiving.length}</div>
            <p className="text-xs text-muted-foreground">
              Entregas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingReceiving.filter((order: any) => isOverdue(order)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Entregas atrasadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Receiving Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aguardando Recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReceiving.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-pending">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum recebimento pendente</h3>
              <p className="text-muted-foreground">
                Todas as entregas foram registradas
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Entrega Esperada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReceiving.map((order: any) => (
                  <TableRow 
                    key={order.id} 
                    data-testid={`pending-row-${order.id}`}
                    className={isOverdue(order) ? "bg-red-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {order.purchaseNumber || `#${order.id.slice(-8)}`}
                    </TableCell>
                    <TableCell>{order.supplier?.name || "N/A"}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className={isOverdue(order) ? "text-red-600 font-medium" : ""}>
                        {order.expectedDeliveryDate 
                          ? format(new Date(order.expectedDeliveryDate), "dd/MM/yyyy", { locale: ptBR })
                          : "N/A"
                        }
                        {isOverdue(order) && (
                          <AlertCircle className="h-4 w-4 inline ml-1 text-red-600" />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowReceiveModal(true);
                        }}
                        data-testid={`button-receive-${order.id}`}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Registrar Recebimento
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Completed Receiving Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recebimentos Realizados</CardTitle>
        </CardHeader>
        <CardContent>
          {completedReceiving.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-completed">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum recebimento realizado</h3>
              <p className="text-muted-foreground">
                Os recebimentos confirmados aparecerão aqui
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Data de Recebimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedReceiving.map((order: any) => (
                  <TableRow key={order.id} data-testid={`completed-row-${order.id}`}>
                    <TableCell className="font-medium">
                      {order.purchaseNumber || `#${order.id.slice(-8)}`}
                    </TableCell>
                    <TableCell>{order.supplier?.name || "N/A"}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {order.deliveredDate 
                        ? format(new Date(order.deliveredDate), "dd/MM/yyyy", { locale: ptBR })
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Receive Order Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Pedido {selectedOrder.purchaseNumber || `#${selectedOrder.id.slice(-8)}`}</h4>
                <p className="text-sm text-muted-foreground">
                  Fornecedor: {selectedOrder.supplier?.name || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(selectedOrder.total)}
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="deliveredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Recebimento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-delivered-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações do Recebimento</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Condições da entrega, avarias, etc..."
                            {...field}
                            data-testid="textarea-receiving-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowReceiveModal(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={receiveOrderMutation.isPending}>
                      {receiveOrderMutation.isPending ? "Registrando..." : "Registrar Recebimento"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}