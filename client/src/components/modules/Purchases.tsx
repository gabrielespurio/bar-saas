import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Truck, Users } from "lucide-react";
import PurchaseOrders from "@/components/modules/purchases/PurchaseOrders";
import PurchaseReceiving from "@/components/modules/purchases/PurchaseReceiving";
import SuppliersManagement from "@/components/modules/purchases/SuppliersManagement";

export default function Purchases() {
  const [activeTab, setActiveTab] = useState("orders");

  const stats = [
    {
      title: "Compras este mês",
      value: "R$ 0,00",
      icon: Package,
      description: "Total em compras este mês",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Entregas realizadas",
      value: "0",
      icon: Truck,
      description: "Entregas recebidas",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Aguardando entrega",
      value: "0",
      icon: Package,
      description: "Pedidos pendentes",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total de compras",
      value: "0",
      icon: Users,
      description: "Pedidos realizados",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="purchases-module">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="purchases-title">
            Compras
          </h1>
          <p className="text-muted-foreground" data-testid="purchases-subtitle">
            Registro de compras e controle de fornecedores
          </p>
        </div>
        <Button
          onClick={() => setActiveTab("orders")}
          className="flex items-center gap-2"
          data-testid="button-new-purchase"
        >
          <Plus className="h-4 w-4" />
          Nova Compra
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3" data-testid="purchases-tabs">
          <TabsTrigger value="orders" data-testid="tab-orders">
            Gestão de Pedidos
          </TabsTrigger>
          <TabsTrigger value="receiving" data-testid="tab-receiving">
            Recebimentos
          </TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">
            Gestão de Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4" data-testid="content-orders">
          <PurchaseOrders />
        </TabsContent>

        <TabsContent value="receiving" className="space-y-4" data-testid="content-receiving">
          <PurchaseReceiving />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4" data-testid="content-suppliers">
          <SuppliersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}