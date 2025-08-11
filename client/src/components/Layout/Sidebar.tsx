import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  activeModule: string;
}

export default function Sidebar({ activeModule }: SidebarProps) {
  const { company, logout } = useAuth();

  const isSystemAdmin = company?.userType === 'system_admin';

  const menuItems = isSystemAdmin ? [
    { id: "system-companies", label: "Gerenciar Empresas", icon: "fas fa-building", path: "/dashboard/system-companies" },
  ] : [
    { id: "overview", label: "Visão Geral", icon: "fas fa-chart-line", path: "/" },
    { id: "sales", label: "Vendas", icon: "fas fa-cash-register", path: "/dashboard/sales" },
    { id: "purchases", label: "Compras", icon: "fas fa-shopping-cart", path: "/dashboard/purchases" },
    { id: "inventory", label: "Estoque", icon: "fas fa-boxes", path: "/dashboard/inventory" },
    { id: "financial", label: "Financeiro", icon: "fas fa-chart-pie", path: "/dashboard/financial" },
    { id: "company", label: "Empresa", icon: "fas fa-building", path: "/dashboard/company" },
  ];

  return (
    <div className="sidebar p-0" style={{ width: "280px" }}>
      <div className="p-4">
        <div className="d-flex align-items-center mb-4">
          <i className="fas fa-cocktail fa-2x text-white me-3"></i>
          <div>
            <h4 className="text-white mb-0 fw-bold">BarManager</h4>
            <small className="text-white opacity-75">{company?.name}</small>
          </div>
        </div>
      </div>

      <nav className="px-3">
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item mb-1">
              <Link href={item.path}>
                <a
                  className={`nav-link d-flex align-items-center py-3 px-3 ${
                    activeModule === item.id ? "active" : ""
                  }`}
                >
                  <i className={`${item.icon} me-3`}></i>
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto p-3" style={{ position: "absolute", bottom: 0, width: "280px" }}>
        <div className="border-top border-light border-opacity-25 pt-3">
          <div className="d-flex align-items-center text-white mb-3">
            <div className="bg-white bg-opacity-25 rounded-circle p-2 me-3">
              <i className="fas fa-user"></i>
            </div>
            <div>
              <small className="d-block opacity-75">
                {isSystemAdmin ? "Super Administrador" : "Administrador"}
              </small>
              <small className="d-block fw-medium">{company?.email}</small>
            </div>
          </div>
          <button
            className="btn btn-outline-light btn-sm w-100"
            onClick={logout}
          >
            <i className="fas fa-sign-out-alt me-2"></i>Sair
          </button>
        </div>
      </div>
    </div>
  );
}
