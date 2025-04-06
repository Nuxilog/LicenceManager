import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import 'dotenv/config';
import * as schema from '@shared/schema';

const DATABASE_URL = process.env.DATABASE_URL || '';

// Create PostgreSQL client
const client = postgres(DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(client, { schema });

// For raw SQL queries
export async function executeRawQuery(query: string, params: any[] = []) {
  return client.unsafe(query, params);
}
