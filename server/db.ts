import { sql } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '@shared/schema';
import { Connection, Pool } from 'mysql2/promise';
import type { MySqlDatabase } from 'drizzle-orm/mysql2';

// Toujours utiliser MySQL
const useMySQL = true;

// Types pour les connexions MySQL
type MySqlConnection = Connection;
type DbConnection = MySqlConnection | null;
// Définir les types manquants pour éviter les erreurs de compilation
type DrizzleDb = MySqlDatabase<any, any> | null;

let connection: DbConnection = null;
let pool: Pool | null = null;
let db: DrizzleDb = null;

// Function to establish database connection
async function createDatabaseConnection(): Promise<DbPromiseResult> {
  try {
    console.log('Using MySQL connection from .env');
    const mysql = await import('mysql2/promise');
    const { drizzle } = await import('drizzle-orm/mysql2');
    
    // Configuration avec reconnexion automatique
    const connectionConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000, // 10 secondes max pour se connecter
      waitForConnections: true,
      // Activer la reconnexion automatique
      connectionLimit: 10,
      queueLimit: 0
    };
    
    console.log('Creating MySQL connection pool...');
    // Créer un pool global et le stocker
    pool = mysql.createPool(connectionConfig);
    console.log('MySQL connection pool created successfully.');

    // Obtenir une connexion pour Drizzle
    try {
      const conn = await pool.getConnection();
      connection = conn;
      db = drizzle(conn);
      conn.release(); // Release the connection back to the pool
    } catch (connError) {
      console.error('Error getting connection from pool:', connError);
    }
    
    return { connection, db, pool };
  } catch (error) {
    console.error('Error connecting to database:', error);
    // Retourner une connexion vide pour permettre à l'application de démarrer
    return { 
      connection: null, 
      db: null,
      pool: null
    };
  }
}

// Type pour le résultat de la promesse de connexion
type DbPromiseResult = {
  connection: DbConnection;
  db: DrizzleDb;
  pool: Pool | null;
};

// Initialize connection in background
let dbPromise: Promise<DbPromiseResult> = Promise.resolve({ 
  connection: null, 
  db: null,
  pool: null 
});

// Start async connection but don't wait for it
(async () => {
  try {
    dbPromise = createDatabaseConnection();
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
  }
})();

// Function to describe table structure
export async function describeTable(tableName: string) {
  const { connection } = await dbPromise;
  
  // Si pas de connexion disponible, renvoyer un tableau vide
  if (!connection) {
    console.warn("Database connection not available - cannot describe table structure");
    return [];
  }
  
  try {
    console.log(`Examining structure of table '${tableName}'...`);
    const [columns] = await (connection as MySqlConnection).query(`DESCRIBE ${tableName}`);
    console.log(`Columns in table '${tableName}':`, columns);
    return columns;
  } catch (error: any) {
    console.error(`Error describing table '${tableName}':`, error);
    return [];
  }
}

// For raw SQL queries
export async function executeRawQuery(query: string, params: any[] = []) {
  const { pool } = await dbPromise;
  
  // Si pas de pool disponible, renvoyer un tableau vide
  if (!pool) {
    console.warn("Database connection pool not available - returning empty result for query:", query);
    return [];
  }
  
  try {
    // Exécuter directement la requête avec le pool (pas besoin de connection/release manuellement)
    const [results] = await pool.query(query, params);
    return results;
  } catch (error: any) {
    console.error("Error executing query:", error);
    // Si erreur de table inexistante, essayons de lister les tables disponibles
    if (error.code === 'ER_NO_SUCH_TABLE') {
      try {
        console.log("Tentative de lister les tables disponibles...");
        const [tables] = await pool.query('SHOW TABLES');
        console.log("Tables disponibles dans la base de données:", tables);
      } catch (listError) {
        console.error("Impossible de lister les tables:", listError);
      }
    }
    
    // Renvoyer un tableau vide au lieu de planter l'application
    console.warn("Returning empty results due to query error");
    return [];
  }
}

// Function to list all database tables
export async function listTables() {
  const { pool } = await dbPromise;
  
  // Si pas de pool disponible, renvoyer un tableau vide
  if (!pool) {
    console.warn("Database connection pool not available - cannot list tables");
    return [];
  }
  
  try {
    console.log("Listing all available tables...");
    const [tables] = await pool.query('SHOW TABLES');
    console.log("Tables available in database:", tables);
    return tables;
  } catch (error: any) {
    console.error("Error listing tables:", error);
    return [];
  }
}

// Export database
export const getDb = async () => {
  const { db } = await dbPromise;
  return db;
}
