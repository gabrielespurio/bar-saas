import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the provided Neon database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9EVxCtIRm3uQ@ep-tiny-sun-ac8aoxy4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });