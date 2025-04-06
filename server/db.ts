import { sql } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '@shared/schema';
import { Connection } from 'mysql2/promise';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { MySqlDatabase } from 'drizzle-orm/mysql2';

// Use .env configuration or fallback to Replit's PostgreSQL config
// On vérifie que DB_HOST existe et qu'il n'est pas une valeur par défaut
const useMySQL = process.env.DB_HOST && 
                 process.env.DB_HOST !== 'your_mysql_host' && 
                 process.env.DB_HOST.trim() !== '' ? true : false;

// Types pour les connexions MySQL et PostgreSQL
type MySqlConnection = Connection;
type PostgresConnection = ReturnType<typeof import('postgres').default>;
type DbConnection = MySqlConnection | PostgresConnection | null;
type DrizzleDb = MySqlDatabase<any> | PostgresJsDatabase<any> | null;

let connection: DbConnection = null;
let db: DrizzleDb = null;

// Function to establish database connection
async function createDatabaseConnection() {
  try {
    if (useMySQL) {
      console.log('Using MySQL connection from .env');
      const mysql = await import('mysql2/promise');
      const { drizzle } = await import('drizzle-orm/mysql2');
      
      // Ajouter un délai d'attente et un timeout
      const connectionConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 10000, // 10 secondes max pour se connecter
        waitForConnections: true
      };
      
      console.log('Connecting to MySQL database...');
      connection = await mysql.createConnection(connectionConfig);
      console.log('MySQL connection established successfully.');

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
  } catch (error) {
    console.error('Error connecting to database:', error);
    // Retourner une connexion vide pour permettre à l'application de démarrer
    return { 
      connection: null, 
      db: null 
    };
  }
}

// Initialize connection in background
let dbPromise = Promise.resolve({ connection: null, db: null });

// Start async connection but don't wait for it
(async () => {
  try {
    dbPromise = createDatabaseConnection();
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
  }
})();

// Function to describe table structure (MySQL only)
export async function describeTable(tableName: string) {
  const { connection } = await dbPromise;
  
  // Si pas de connexion disponible, renvoyer un tableau vide
  if (!connection) {
    console.warn("Database connection not available - cannot describe table structure");
    return [];
  }
  
  if (useMySQL && connection) {
    try {
      console.log(`Examining structure of table '${tableName}'...`);
      // Type assertion pour aider TypeScript à comprendre la connexion MySQL
      const mysqlConnection = connection as MySqlConnection;
      const [columns] = await mysqlConnection.query(`DESCRIBE ${tableName}`);
      console.log(`Columns in table '${tableName}':`, columns);
      return columns;
    } catch (error: any) {
      console.error(`Error describing table '${tableName}':`, error);
      return [];
    }
  } else {
    console.log("Table description only available for MySQL");
    return [];
  }
}

// For raw SQL queries
export async function executeRawQuery(query: string, params: any[] = []) {
  const { connection } = await dbPromise;
  
  // Si pas de connexion disponible, renvoyer un tableau vide
  if (!connection) {
    console.warn("Database connection not available - returning empty result for query:", query);
    return [];
  }
  
  if (useMySQL) {
    try {
      // Type assertion pour aider TypeScript à comprendre la connexion MySQL
      const mysqlConnection = connection as MySqlConnection;
      const [results] = await mysqlConnection.query(query, params);
      return results;
    } catch (error: any) {
      console.error("Error executing query:", error);
      // Si erreur de table inexistante, essayons de lister les tables disponibles
      if (error.code === 'ER_NO_SUCH_TABLE') {
        try {
          console.log("Tentative de lister les tables disponibles...");
          // Type assertion pour aider TypeScript à comprendre la connexion MySQL
          const mysqlConnection = connection as MySqlConnection;
          const [tables] = await mysqlConnection.query('SHOW TABLES');
          console.log("Tables disponibles dans la base de données:", tables);
        } catch (listError) {
          console.error("Impossible de lister les tables:", listError);
        }
      }
      
      // Renvoyer un tableau vide au lieu de planter l'application
      console.warn("Returning empty results due to query error");
      return [];
    }
  } else if (connection) {
    try {
      // Type assertion pour aider TypeScript à comprendre la connexion PostgreSQL
      const postgresConnection = connection as PostgresConnection;
      return await postgresConnection.unsafe(query, params);
    } catch (error) {
      console.error("Error executing PostgreSQL query:", error);
      return [];
    }
  } else {
    // Ne devrait jamais arriver car on a déjà vérifié connection != null
    return [];
  }
}

// Export database
export const getDb = async () => {
  const { db } = await dbPromise;
  return db;
}
