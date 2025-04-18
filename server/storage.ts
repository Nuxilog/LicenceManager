import { users, type User } from "@shared/schema";

// Définir InsertUser directement pour éviter les erreurs de typage
interface InsertUser {
  username: string;
  password: string;
}
import { executeRawQuery, getDb } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const query = `
      SELECT * 
      FROM users 
      WHERE id = $1
    `;
    
    const results = await executeRawQuery(query, [id]);
    const users = results as unknown as any[];
    
    return users.length > 0 ? users[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const query = `
      SELECT * 
      FROM users 
      WHERE username = $1
    `;
    
    const results = await executeRawQuery(query, [username]);
    const users = results as unknown as any[];
    
    return users.length > 0 ? users[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const query = `
      INSERT INTO users (username, password)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    // Vérifier que insertUser a les propriétés nécessaires
    if (!insertUser.username || !insertUser.password) {
      throw new Error('Username and password are required');
    }
    
    const results = await executeRawQuery(query, [insertUser.username, insertUser.password]);
    const insertedUsers = results as unknown as any[];
    
    if (insertedUsers.length === 0) {
      throw new Error('Failed to create user');
    }
    
    return insertedUsers[0];
  }
}

export const storage = new DatabaseStorage();
