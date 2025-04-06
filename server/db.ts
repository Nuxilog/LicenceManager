import { sql } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '@shared/schema';

// Use .env configuration or fallback to Replit's PostgreSQL config
// On vérifie que DB_HOST existe et qu'il n'est pas une valeur par défaut
const useMySQL = process.env.DB_HOST && 
                 process.env.DB_HOST !== 'your_mysql_host' && 
                 process.env.DB_HOST.trim() !== '' ? true : false;

let connection: any;
let db: any;

// Function to establish database connection
async function createDatabaseConnection() {
  if (useMySQL) {
    console.log('Using MySQL connection from .env');
    const mysql = await import('mysql2/promise');
    const { drizzle } = await import('drizzle-orm/mysql2');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    db = drizzle(connection);
    return { connection, db };
  } else {
    // Fallback to PostgreSQL (for Replit development)
    console.log('Using Replit PostgreSQL connection');
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = await import('postgres');
    
    const DATABASE_URL = process.env.DATABASE_URL || '';
    connection = postgres.default(DATABASE_URL);
    db = drizzle(connection);
    return { connection, db };
  }
}

// Initialize connection
const dbPromise = createDatabaseConnection();

// For raw SQL queries
export async function executeRawQuery(query: string, params: any[] = []) {
  const { connection } = await dbPromise;
  
  if (useMySQL) {
    const [results] = await connection.query(query, params);
    return results;
  } else {
    return connection.unsafe(query, params);
  }
}

// Export database
export const getDb = async () => {
  const { db } = await dbPromise;
  return db;
}
