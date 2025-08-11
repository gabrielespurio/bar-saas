import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9EVxCtIRm3uQ@ep-tiny-sun-ac8aoxy4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString: DATABASE_URL });

async function seedAdmin() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Check if admin user already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM companies WHERE email = $1',
      ['admin@barmanager.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Usuário admin já existe!');
      console.log('📧 Email: admin@barmanager.com');
      console.log('🔑 Senha: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    const adminUser = await pool.query(`
      INSERT INTO companies (
        id, name, cnpj, email, password, user_type, active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), 
        'SuperAdmin', 
        '00.000.000/0001-00', 
        'admin@barmanager.com', 
        $1, 
        'system_admin', 
        true, 
        NOW(), 
        NOW()
      ) RETURNING *
    `, [hashedPassword]);

    console.log('✅ Usuário superadmin criado com sucesso!');
    console.log('📧 Email: admin@barmanager.com');
    console.log('🔑 Senha: admin123');
    console.log('👤 Tipo: system_admin');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await pool.end();
  }
}

seedAdmin();