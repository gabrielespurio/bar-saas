import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  email: string;
  cnpj: string;
  userType: 'system_admin' | 'company_admin';
  active: boolean;
}

interface AuthContextType {
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedCompany = localStorage.getItem("company");

    if (storedToken && storedCompany) {
      setToken(storedToken);
      setCompany(JSON.parse(storedCompany));
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", { email, password: "***" });
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);
      
      const { token: newToken, company: newCompany } = response.data;

      setToken(newToken);
      setCompany(newCompany);

      localStorage.setItem("token", newToken);
      localStorage.setItem("company", JSON.stringify(newCompany));
      
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error.response?.data);
      throw new Error(error.response?.data?.message || "Erro ao fazer login");
    }
  };

  const register = async (data: any) => {
    try {
      const response = await api.post("/auth/register", data);
      const { token: newToken, company: newCompany } = response.data;

      setToken(newToken);
      setCompany(newCompany);

      localStorage.setItem("token", newToken);
      localStorage.setItem("company", JSON.stringify(newCompany));
      
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erro ao registrar empresa");
    }
  };

  const logout = () => {
    setToken(null);
    setCompany(null);

    localStorage.removeItem("token");
    localStorage.removeItem("company");
    
    delete api.defaults.headers.common["Authorization"];
    
    // Force redirect to login page
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        company,
        token,
        isAuthenticated: !!token && !!company,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}