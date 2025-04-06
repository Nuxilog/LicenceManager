import mysql from 'mysql2/promise';
import 'dotenv/config';

// Get MySQL connection parameters from environment variables
const nuxiDevConfig = {
  host: process.env.AUTH_MYSQL_NUXIDEV_HOST || 'sqlprive-dd25990-001.eu.clouddb.ovh.net',
  port: parseInt(process.env.AUTH_MYSQL_NUXIDEV_PORT || '35217'),
  user: process.env.AUTH_MYSQL_NUXIDEV_USER || 'UserBDD',
  password: process.env.AUTH_MYSQL_NUXIDEV_PASSWORD || '99Un5yc4',
  database: process.env.AUTH_MYSQL_NUXIDEV_DATABASE || 'NuxiDev2018',
};

// Create a pool of connections for better performance
const nuxiDevPool = mysql.createPool({
  ...nuxiDevConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [results] = await nuxiDevPool.execute(query, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export const db = {
  nuxiDev: {
    query: executeQuery,
  },
};
