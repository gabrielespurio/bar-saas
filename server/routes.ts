import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema, insertCompanySchema, insertProductSchema, insertSupplierSchema, insertCompanyUserSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to authenticate JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token de acesso requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido" });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // First, check if it's a company login
      const company = await storage.getCompanyByEmail(email);
      if (company) {
        const isValidPassword = await bcrypt.compare(password, company.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Email ou senha inválidos" });
        }

        if (!company.active) {
          return res.status(401).json({ message: "Empresa inativa. Entre em contato com o suporte." });
        }

        const token = jwt.sign(
          { companyId: company.id, email: company.email, userType: company.userType, userId: company.id },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({
          token,
          company: {
            id: company.id,
            name: company.name,
            email: company.email,
            cnpj: company.cnpj,
            userType: company.userType,
            active: company.active,
          },
        });
      }

      // If not found in companies, check company users
      const companyUser = await storage.getCompanyUserByEmail(email);
      if (!companyUser) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const isValidPassword = await bcrypt.compare(password, companyUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      if (!companyUser.active) {
        return res.status(401).json({ message: "Usuário inativo. Entre em contato com o administrador da empresa." });
      }

      // Get company information for the user
      const userCompany = await storage.getCompany(companyUser.companyId);
      if (!userCompany || !userCompany.active) {
        return res.status(401).json({ message: "Empresa inativa. Entre em contato com o suporte." });
      }

      const token = jwt.sign(
        { 
          companyId: companyUser.companyId, 
          email: companyUser.email, 
          userType: companyUser.userType,
          userId: companyUser.id 
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        company: {
          id: userCompany.id,
          name: userCompany.name,
          email: companyUser.email, // Use the user's email, not company email
          cnpj: userCompany.cnpj,
          userType: companyUser.userType,
          active: companyUser.active,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if company already exists
      const existingCompany = await storage.getCompanyByEmail(data.email);
      if (existingCompany) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const company = await storage.createCompany({
        name: data.name,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { companyId: company.id, email: company.email, userType: company.userType },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        token,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          cnpj: company.cnpj,
          userType: company.userType,
          active: company.active,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const company = await storage.getCompany(req.user.companyId);
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      res.json({
        id: company.id,
        name: company.name,
        email: company.email,
        cnpj: company.cnpj,
        userType: company.userType,
        active: company.active,
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Company management routes
  app.put("/api/companies/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Ensure user can only update their own company
      if (id !== req.user.companyId) {
        return res.status(403).json({ message: "Não autorizado" });
      }

      const updateData = z.object({
        name: z.string().min(1).optional(),
        cnpj: z.string().min(14).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }).parse(req.body);

      const company = await storage.updateCompany(id, updateData);
      res.json({
        id: company.id,
        name: company.name,
        email: company.email,
        cnpj: company.cnpj,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Update company error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // System admin routes for managing all companies
  const requireSystemAdmin = (req: any, res: any, next: any) => {
    if (req.user.userType !== 'system_admin') {
      return res.status(403).json({ message: "Acesso negado. Apenas super administradores podem acessar esta funcionalidade." });
    }
    next();
  };

  app.get("/api/system/companies", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const companies = await storage.getAllCompanies();
      const companiesWithoutPasswords = companies.map(company => ({
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone,
        userType: company.userType,
        active: company.active,
        createdAt: company.createdAt,
      }));
      res.json(companiesWithoutPasswords);
    } catch (error) {
      console.error("Get all companies error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/system/companies", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const companyData = z.object({
        name: z.string().min(1),
        cnpj: z.string().min(14),
        email: z.string().email(),
        phone: z.string().min(1),
        cep: z.string().min(8),
        address: z.string().min(1),
        addressNumber: z.string().min(1),
        neighborhood: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        website: z.string().optional(),
        businessType: z.string().min(1),
        ownerName: z.string().min(1),
        ownerEmail: z.string().email(),
        ownerPhone: z.string().min(1),
      }).parse(req.body);

      // Create company without password - admin users will be created separately
      const defaultPassword = await bcrypt.hash("123456", 10); // Temporary password
      const company = await storage.createCompany({
        ...companyData,
        password: defaultPassword,
        userType: 'company_admin',
        active: true,
      });

      res.status(201).json({
        id: company.id,
        name: company.name,
        email: company.email,
        cnpj: company.cnpj,
        phone: company.phone,
        cep: company.cep,
        address: company.address,
        addressNumber: company.addressNumber,
        neighborhood: company.neighborhood,
        city: company.city,
        state: company.state,
        website: company.website,
        businessType: company.businessType,
        ownerName: company.ownerName,
        ownerEmail: company.ownerEmail,
        ownerPhone: company.ownerPhone,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create company error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/system/companies/:id/status", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { active } = z.object({
        active: z.boolean(),
      }).parse(req.body);

      const company = await storage.toggleCompanyStatus(id, active);
      res.json({
        id: company.id,
        name: company.name,
        email: company.email,
        active: company.active,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Toggle company status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Company Users management routes
  app.get("/api/system/companies/:companyId/users", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const { companyId } = req.params;
      const users = await storage.getCompanyUsers(companyId);
      const usersWithoutPasswords = users.map(user => ({
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        userType: user.userType,
        active: user.active,
        createdAt: user.createdAt,
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get company users error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/system/companies/:companyId/users", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const { companyId } = req.params;
      const userData = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await storage.createCompanyUser({
        companyId: companyId,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        userType: 'company_admin',
        active: true,
      });

      res.status(201).json({
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        userType: user.userType,
        active: user.active,
        createdAt: user.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create company user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/system/companies/:companyId/users/:userId/status", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const { companyId, userId } = req.params;
      const { active } = z.object({
        active: z.boolean(),
      }).parse(req.body);

      const user = await storage.toggleCompanyUserStatus(userId, companyId, active);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Toggle user status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/system/companies/:companyId/users/:userId", authenticateToken, requireSystemAdmin, async (req: any, res) => {
    try {
      const { companyId, userId } = req.params;
      await storage.deleteCompanyUser(userId, companyId);
      res.json({ message: "Usuário removido com sucesso" });
    } catch (error) {
      console.error("Delete company user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.companyId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Products routes
  app.get("/api/products", authenticateToken, async (req: any, res) => {
    try {
      const products = await storage.getProducts(req.user.companyId);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/products", authenticateToken, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        companyId: req.user.companyId,
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const productData = insertProductSchema.partial().parse(req.body);
      
      const product = await storage.updateProduct(id, req.user.companyId, productData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Update product error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id, req.user.companyId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Sales routes
  app.get("/api/sales", authenticateToken, async (req: any, res) => {
    try {
      const sales = await storage.getSales(req.user.companyId);
      res.json(sales);
    } catch (error) {
      console.error("Get sales error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/sales", authenticateToken, async (req: any, res) => {
    try {
      const { items, ...saleData } = req.body;
      
      const sale = await storage.createSale(
        { ...saleData, companyId: req.user.companyId },
        items
      );
      
      res.status(201).json(sale);
    } catch (error) {
      console.error("Create sale error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/sales/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const sale = await storage.updateSaleStatus(id, req.user.companyId, status);
      res.json(sale);
    } catch (error) {
      console.error("Update sale status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", authenticateToken, async (req: any, res) => {
    try {
      const suppliers = await storage.getSuppliers(req.user.companyId);
      res.json(suppliers);
    } catch (error) {
      console.error("Get suppliers error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/suppliers", authenticateToken, async (req: any, res) => {
    try {
      const supplierData = insertSupplierSchema.parse({
        ...req.body,
        companyId: req.user.companyId,
      });
      
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create supplier error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Purchases routes
  app.get("/api/purchases", authenticateToken, async (req: any, res) => {
    try {
      const purchases = await storage.getPurchases(req.user.companyId);
      res.json(purchases);
    } catch (error) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/purchases", authenticateToken, async (req: any, res) => {
    try {
      const { items, ...purchaseData } = req.body;
      
      const purchase = await storage.createPurchase(
        { ...purchaseData, companyId: req.user.companyId },
        items
      );
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Create purchase error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/purchases/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const purchase = await storage.updatePurchaseStatus(id, req.user.companyId, status);
      res.json(purchase);
    } catch (error) {
      console.error("Update purchase status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Financial routes
  app.get("/api/accounts-receivable", authenticateToken, async (req: any, res) => {
    try {
      const accounts = await storage.getAccountsReceivable(req.user.companyId);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts receivable error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/accounts-payable", authenticateToken, async (req: any, res) => {
    try {
      const accounts = await storage.getAccountsPayable(req.user.companyId);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts payable error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/accounts-receivable", authenticateToken, async (req: any, res) => {
    try {
      const accountData = {
        ...req.body,
        companyId: req.user.companyId,
      };
      
      const account = await storage.createAccountReceivable(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Create account receivable error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/accounts-payable", authenticateToken, async (req: any, res) => {
    try {
      const accountData = {
        ...req.body,
        companyId: req.user.companyId,
      };
      
      const account = await storage.createAccountPayable(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Create account payable error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/accounts-receivable/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const account = await storage.updateAccountReceivableStatus(id, req.user.companyId, status);
      res.json(account);
    } catch (error) {
      console.error("Update account receivable status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/accounts-payable/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const account = await storage.updateAccountPayableStatus(id, req.user.companyId, status);
      res.json(account);
    } catch (error) {
      console.error("Update account payable status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
