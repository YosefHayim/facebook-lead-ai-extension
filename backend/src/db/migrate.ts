import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inFunction = false;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('--') || trimmedLine === '') {
      continue;
    }
    
    if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
    }
    
    current += line + '\n';
    
    if (inFunction) {
      if (trimmedLine.includes("language 'plpgsql'") || trimmedLine.includes('LANGUAGE plpgsql')) {
        inFunction = false;
        if (current.trim()) {
          statements.push(current.trim());
        }
        current = '';
      }
    } else if (trimmedLine.endsWith(';') && !inFunction) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  console.log('[Migration] Starting database migration...');
  console.log('[Migration] Reading schema from:', schemaPath);

  const statements = splitSqlStatements(schema);
  console.log(`[Migration] Found ${statements.length} SQL statements to execute`);

  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');
      console.log(`[Migration] Executing (${i + 1}/${statements.length}): ${preview}...`);
      await sql(statement);
    }
    
    console.log('[Migration] Schema applied successfully');
    
    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('[Migration] Created tables:');
    tables.forEach((t) => console.log(`  - ${(t as { tablename: string }).tablename}`));
    
    console.log('[Migration] Migration completed successfully');
  } catch (error) {
    console.error('[Migration] Failed:', error);
    process.exit(1);
  }
}

migrate();
