import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package } from "lucide-react";
import PurchaseOrders from "@/components/modules/purchases/PurchaseOrders";
import PurchaseReceiving from "@/components/modules/purchases/PurchaseReceiving";
import SuppliersManagement from "@/components/modules/purchases/SuppliersManagement";

export default function Purchases() {
  const [activeTab, setActiveTab] = useState("orders");



  return (
    <div className="p-6 space-y-6" data-testid="purchases-module">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="purchases-title">
          Compras
        </h1>
        <p className="text-muted-foreground" data-testid="purchases-subtitle">
          Registro de compras e controle de fornecedores
        </p>
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