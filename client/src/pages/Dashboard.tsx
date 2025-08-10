import { useParams } from "wouter";
import Sidebar from "@/components/Layout/Sidebar";
import Overview from "@/components/modules/Overview";
import Sales from "@/components/modules/Sales";
import Purchases from "@/components/modules/Purchases";
import Inventory from "@/components/modules/Inventory";
import Financial from "@/components/modules/Financial";

export default function Dashboard() {
  const params = useParams();
  const activeModule = params.module || "overview";

  const renderModule = () => {
    switch (activeModule) {
      case "sales":
        return <Sales />;
      case "purchases":
        return <Purchases />;
      case "inventory":
        return <Inventory />;
      case "financial":
        return <Financial />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="d-flex">
      <Sidebar activeModule={activeModule} />
      <div className="flex-1 min-h-screen">
        {renderModule()}
      </div>
    </div>
  );
}
