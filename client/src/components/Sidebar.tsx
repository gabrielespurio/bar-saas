import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export default function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const { user } = useAuth();

  const menuItems = [
    { id: "overview", icon: "fas fa-chart-line", label: "Visão Geral" },
    { id: "sales", icon: "fas fa-cash-register", label: "Vendas" },
    { id: "purchases", icon: "fas fa-shopping-cart", label: "Compras" },
    { id: "inventory", icon: "fas fa-boxes", label: "Estoque" },
    { id: "financial", icon: "fas fa-chart-pie", label: "Financeiro" },
  ];

  return (
    <div className="sidebar p-0" style={{ width: "280px" }}>
      <div className="p-4">
        <div className="d-flex align-items-center mb-4">
          <i className="fas fa-cocktail fa-2x text-white me-3"></i>
          <div>
            <h4 className="text-white mb-0 fw-bold">BarManager</h4>
            <small className="text-white opacity-75">{user?.name}</small>
          </div>
        </div>
      </div>
      
      <nav className="px-3">
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item mb-1">
              <button
                className={`nav-link d-flex align-items-center py-3 px-3 w-100 border-0 bg-transparent ${
                  activeModule === item.id ? "active" : ""
                }`}
                onClick={() => setActiveModule(item.id)}
              >
                <i className={`${item.icon} me-3`}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto p-3" style={{ position: "absolute", bottom: 0, width: "100%" }}>
        <div className="border-top border-light border-opacity-25 pt-3">
          <div className="d-flex align-items-center text-white mb-3">
            <div className="bg-white bg-opacity-25 rounded-circle p-2 me-3">
              <i className="fas fa-user"></i>
            </div>
            <div>
              <small className="d-block opacity-75">Administrador</small>
              <small className="d-block fw-medium">{user?.email}</small>
            </div>
          </div>
          <button className="btn btn-outline-light btn-sm w-100" onClick={logout}>
            <i className="fas fa-sign-out-alt me-2"></i>Sair
          </button>
        </div>
      </div>
    </div>
  );
}
