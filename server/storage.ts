import {
  companies,
  products,
  sales,
  saleItems,
  suppliers,
  purchases,
  purchaseItems,
  accountsReceivable,
  accountsPayable,
  type Company,
  type InsertCompany,
  type Product,
  type InsertProduct,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type Supplier,
  type InsertSupplier,
  type Purchase,
  type InsertPurchase,
  type PurchaseItem,
  type InsertPurchaseItem,
  type AccountReceivable,
  type InsertAccountReceivable,
  type AccountPayable,
  type InsertAccountPayable,
  companyUsers,
  type CompanyUser,
  type InsertCompanyUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, count, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>; // For system admin
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  toggleCompanyStatus(id: string, active: boolean): Promise<Company>;

  // Company Users operations
  getCompanyUsers(companyId: string): Promise<CompanyUser[]>;
  getCompanyUser(id: string, companyId: string): Promise<CompanyUser | undefined>;
  createCompanyUser(user: InsertCompanyUser): Promise<CompanyUser>;
  updateCompanyUser(id: string, companyId: string, user: Partial<InsertCompanyUser>): Promise<CompanyUser>;
  deleteCompanyUser(id: string, companyId: string): Promise<void>;
  toggleCompanyUserStatus(id: string, companyId: string, active: boolean): Promise<CompanyUser>;

  // Product operations
  getProducts(companyId: string): Promise<Product[]>;
  getProduct(id: string, companyId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, companyId: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string, companyId: string): Promise<void>;

  // Sales operations
  getSales(companyId: string): Promise<(Sale & { items: SaleItem[]; itemCount: number })[]>;
  getSale(id: string, companyId: string): Promise<(Sale & { items: SaleItem[] }) | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  updateSaleStatus(id: string, companyId: string, status: 'pending' | 'paid' | 'cancelled'): Promise<Sale>;

  // Purchase operations
  getPurchases(companyId: string): Promise<(Purchase & { supplier: Supplier; items: PurchaseItem[]; itemCount: number })[]>;
  getPurchase(id: string, companyId: string): Promise<(Purchase & { supplier: Supplier; items: PurchaseItem[] }) | undefined>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase>;
  updatePurchaseStatus(id: string, companyId: string, status: 'pending' | 'delivered' | 'cancelled'): Promise<Purchase>;

  // Supplier operations
  getSuppliers(companyId: string): Promise<Supplier[]>;
  getSupplier(id: string, companyId: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, companyId: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string, companyId: string): Promise<void>;

  // Financial operations
  getAccountsReceivable(companyId: string): Promise<AccountReceivable[]>;
  getAccountsPayable(companyId: string): Promise<AccountPayable[]>;
  createAccountReceivable(account: InsertAccountReceivable): Promise<AccountReceivable>;
  createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable>;
  updateAccountReceivableStatus(id: string, companyId: string, status: 'pending' | 'paid' | 'overdue' | 'cancelled'): Promise<AccountReceivable>;
  updateAccountPayableStatus(id: string, companyId: string, status: 'pending' | 'paid' | 'overdue' | 'cancelled'): Promise<AccountPayable>;

  // Dashboard stats
  getDashboardStats(companyId: string): Promise<{
    dailySales: string;
    orders: number;
    products: number;
    monthlyRevenue: string;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalReceivable: string;
    totalPayable: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.email, email));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async toggleCompanyStatus(id: string, active: boolean): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ active, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  // Company Users operations
  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return await db.select().from(companyUsers).where(eq(companyUsers.companyId, companyId)).orderBy(desc(companyUsers.createdAt));
  }

  async getCompanyUser(id: string, companyId: string): Promise<CompanyUser | undefined> {
    const [user] = await db
      .select()
      .from(companyUsers)
      .where(and(eq(companyUsers.id, id), eq(companyUsers.companyId, companyId)));
    return user;
  }

  async createCompanyUser(user: InsertCompanyUser): Promise<CompanyUser> {
    const [newUser] = await db.insert(companyUsers).values(user).returning();
    return newUser;
  }

  async updateCompanyUser(id: string, companyId: string, user: Partial<InsertCompanyUser>): Promise<CompanyUser> {
    const [updatedUser] = await db
      .update(companyUsers)
      .set({ ...user, updatedAt: new Date() })
      .where(and(eq(companyUsers.id, id), eq(companyUsers.companyId, companyId)))
      .returning();
    return updatedUser;
  }

  async deleteCompanyUser(id: string, companyId: string): Promise<void> {
    await db.delete(companyUsers).where(and(eq(companyUsers.id, id), eq(companyUsers.companyId, companyId)));
  }

  async toggleCompanyUserStatus(id: string, companyId: string, active: boolean): Promise<CompanyUser> {
    const [updatedUser] = await db
      .update(companyUsers)
      .set({ active, updatedAt: new Date() })
      .where(and(eq(companyUsers.id, id), eq(companyUsers.companyId, companyId)))
      .returning();
    return updatedUser;
  }

  // Product operations
  async getProducts(companyId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.companyId, companyId));
  }

  async getProduct(id: string, companyId: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.companyId, companyId)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, companyId: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.companyId, companyId)))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string, companyId: string): Promise<void> {
    await db.delete(products).where(and(eq(products.id, id), eq(products.companyId, companyId)));
  }

  // Sales operations
  async getSales(companyId: string): Promise<(Sale & { items: SaleItem[]; itemCount: number })[]> {
    const salesData = await db
      .select({
        sale: sales,
        itemCount: count(saleItems.id),
      })
      .from(sales)
      .leftJoin(saleItems, eq(sales.id, saleItems.saleId))
      .where(eq(sales.companyId, companyId))
      .groupBy(sales.id)
      .orderBy(desc(sales.createdAt));

    const salesWithItems = await Promise.all(
      salesData.map(async ({ sale, itemCount }) => {
        const items = await db
          .select()
          .from(saleItems)
          .where(eq(saleItems.saleId, sale.id));
        return { ...sale, items, itemCount };
      })
    );

    return salesWithItems;
  }

  async getSale(id: string, companyId: string): Promise<(Sale & { items: SaleItem[] }) | undefined> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.companyId, companyId)));

    if (!sale) return undefined;

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    return { ...sale, items };
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    return await db.transaction(async (tx) => {
      const [newSale] = await tx.insert(sales).values(sale).returning();
      
      // Insert sale items
      await tx.insert(saleItems).values(
        items.map(item => ({ ...item, saleId: newSale.id }))
      );

      // Update product quantities (reduce stock)
      for (const item of items) {
        await tx
          .update(products)
          .set({ quantity: sql`${products.quantity} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      return newSale;
    });
  }

  async updateSaleStatus(id: string, companyId: string, status: 'pending' | 'paid' | 'cancelled'): Promise<Sale> {
    const [updatedSale] = await db
      .update(sales)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(sales.id, id), eq(sales.companyId, companyId)))
      .returning();
    return updatedSale;
  }

  // Purchase operations
  async getPurchases(companyId: string): Promise<(Purchase & { supplier: Supplier; items: PurchaseItem[]; itemCount: number })[]> {
    const purchasesData = await db
      .select({
        purchase: purchases,
        supplier: suppliers,
        itemCount: count(purchaseItems.id),
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId))
      .where(eq(purchases.companyId, companyId))
      .groupBy(purchases.id, suppliers.id)
      .orderBy(desc(purchases.createdAt));

    const purchasesWithItems = await Promise.all(
      purchasesData.map(async ({ purchase, supplier, itemCount }) => {
        const items = await db
          .select()
          .from(purchaseItems)
          .where(eq(purchaseItems.purchaseId, purchase.id));
        return { ...purchase, supplier: supplier!, items, itemCount };
      })
    );

    return purchasesWithItems;
  }

  async getPurchase(id: string, companyId: string): Promise<(Purchase & { supplier: Supplier; items: PurchaseItem[] }) | undefined> {
    const [purchaseData] = await db
      .select({
        purchase: purchases,
        supplier: suppliers,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(and(eq(purchases.id, id), eq(purchases.companyId, companyId)));

    if (!purchaseData) return undefined;

    const items = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id));
    return { ...purchaseData.purchase, supplier: purchaseData.supplier!, items };
  }

  async createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    return await db.transaction(async (tx) => {
      const [newPurchase] = await tx.insert(purchases).values(purchase).returning();
      
      // Insert purchase items
      await tx.insert(purchaseItems).values(
        items.map(item => ({ ...item, purchaseId: newPurchase.id }))
      );

      return newPurchase;
    });
  }

  async updatePurchaseStatus(id: string, companyId: string, status: 'pending' | 'delivered' | 'cancelled'): Promise<Purchase> {
    return await db.transaction(async (tx) => {
      const [updatedPurchase] = await tx
        .update(purchases)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(purchases.id, id), eq(purchases.companyId, companyId)))
        .returning();

      // If status is 'delivered', update product quantities
      if (status === 'delivered') {
        const items = await tx.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id));
        
        for (const item of items) {
          await tx
            .update(products)
            .set({ quantity: sql`${products.quantity} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      }

      return updatedPurchase;
    });
  }

  // Supplier operations
  async getSuppliers(companyId: string): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.companyId, companyId));
  }

  async getSupplier(id: string, companyId: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, companyId: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string, companyId: string): Promise<void> {
    await db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));
  }

  // Financial operations
  async getAccountsReceivable(companyId: string): Promise<AccountReceivable[]> {
    return await db
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.companyId, companyId))
      .orderBy(desc(accountsReceivable.dueDate));
  }

  async getAccountsPayable(companyId: string): Promise<AccountPayable[]> {
    return await db
      .select()
      .from(accountsPayable)
      .where(eq(accountsPayable.companyId, companyId))
      .orderBy(desc(accountsPayable.dueDate));
  }

  async createAccountReceivable(account: InsertAccountReceivable): Promise<AccountReceivable> {
    const [newAccount] = await db.insert(accountsReceivable).values(account).returning();
    return newAccount;
  }

  async createAccountPayable(account: InsertAccountPayable): Promise<AccountPayable> {
    const [newAccount] = await db.insert(accountsPayable).values(account).returning();
    return newAccount;
  }

  async updateAccountReceivableStatus(id: string, companyId: string, status: 'pending' | 'paid' | 'overdue' | 'cancelled'): Promise<AccountReceivable> {
    const [updatedAccount] = await db
      .update(accountsReceivable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(accountsReceivable.id, id), eq(accountsReceivable.companyId, companyId)))
      .returning();
    return updatedAccount;
  }

  async updateAccountPayableStatus(id: string, companyId: string, status: 'pending' | 'paid' | 'overdue' | 'cancelled'): Promise<AccountPayable> {
    const [updatedAccount] = await db
      .update(accountsPayable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(accountsPayable.id, id), eq(accountsPayable.companyId, companyId)))
      .returning();
    return updatedAccount;
  }

  // Dashboard stats
  async getDashboardStats(companyId: string): Promise<{
    dailySales: string;
    orders: number;
    products: number;
    monthlyRevenue: string;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalReceivable: string;
    totalPayable: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Daily sales
    const [dailySalesResult] = await db
      .select({ total: sum(sales.total) })
      .from(sales)
      .where(
        and(
          eq(sales.companyId, companyId),
          eq(sales.status, 'paid'),
          gte(sales.createdAt, today),
          lte(sales.createdAt, tomorrow)
        )
      );

    // Daily orders count
    const [ordersResult] = await db
      .select({ count: count() })
      .from(sales)
      .where(
        and(
          eq(sales.companyId, companyId),
          gte(sales.createdAt, today),
          lte(sales.createdAt, tomorrow)
        )
      );

    // Total products
    const [productsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.companyId, companyId));

    // Monthly revenue
    const [monthlyRevenueResult] = await db
      .select({ total: sum(sales.total) })
      .from(sales)
      .where(
        and(
          eq(sales.companyId, companyId),
          eq(sales.status, 'paid'),
          gte(sales.createdAt, firstDayOfMonth)
        )
      );

    // Low stock products
    const [lowStockResult] = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId),
          sql`${products.quantity} <= ${products.minStock}`,
          sql`${products.quantity} > 0`
        )
      );

    // Out of stock products
    const [outOfStockResult] = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId),
          eq(products.quantity, 0)
        )
      );

    // Total receivable
    const [receivableResult] = await db
      .select({ total: sum(accountsReceivable.amount) })
      .from(accountsReceivable)
      .where(
        and(
          eq(accountsReceivable.companyId, companyId),
          eq(accountsReceivable.status, 'pending')
        )
      );

    // Total payable
    const [payableResult] = await db
      .select({ total: sum(accountsPayable.amount) })
      .from(accountsPayable)
      .where(
        and(
          eq(accountsPayable.companyId, companyId),
          eq(accountsPayable.status, 'pending')
        )
      );

    return {
      dailySales: dailySalesResult?.total || "0",
      orders: ordersResult?.count || 0,
      products: productsResult?.count || 0,
      monthlyRevenue: monthlyRevenueResult?.total || "0",
      lowStockProducts: lowStockResult?.count || 0,
      outOfStockProducts: outOfStockResult?.count || 0,
      totalReceivable: receivableResult?.total || "0",
      totalPayable: payableResult?.total || "0",
    };
  }
}

export const storage = new DatabaseStorage();
