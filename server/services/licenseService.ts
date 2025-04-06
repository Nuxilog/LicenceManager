import { db, executeRawQuery } from '../db';
import { LicenseFilters, SortConfig } from '../../client/src/types/license';
import { nuxiDevLicenses } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

class NuxiDevLicenseService {
  /**
   * Get licenses with optional filtering and sorting
   */
  async getLicenses(filters: LicenseFilters, sortConfig: SortConfig) {
    // Build raw SQL query
    let query = `
      SELECT * 
      FROM nuxi_dev_licenses
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Apply filters
    if (filters.onlyNuxiDev) {
      query += ` AND "nom_soft" = $${queryParams.length + 1}`;
      queryParams.push('NuxiDev');
    }
    
    if (filters.idClient) {
      query += ` AND "id_client" = $${queryParams.length + 1}`;
      queryParams.push(filters.idClient);
    }
    
    if (filters.idSynchro) {
      query += ` AND "id_synchro" = $${queryParams.length + 1}`;
      queryParams.push(filters.idSynchro);
    }
    
    if (filters.serial) {
      query += ` AND "serial" LIKE $${queryParams.length + 1}`;
      queryParams.push(`%${filters.serial}%`);
    }
    
    if (filters.identifiantPC) {
      query += ` AND "identifiant_pc" LIKE $${queryParams.length + 1}`;
      queryParams.push(`%${filters.identifiantPC}%`);
    }
    
    // Convert the key for sorting (PascalCase to snake_case)
    const sortKey = sortConfig.key.replace(/([A-Z])/g, '_$1').toLowerCase();
    query += ` ORDER BY "${sortKey}" ${sortConfig.direction.toUpperCase()}`;
    
    // Execute query
    const results = await executeRawQuery(query, queryParams);
    
    // Convert snake_case to PascalCase for frontend compatibility
    return results.map(row => {
      const convertedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        // Convert snake_case to PascalCase
        const pascalKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        // Ensure first letter is capitalized
        const finalKey = pascalKey.charAt(0).toUpperCase() + pascalKey.slice(1);
        convertedRow[finalKey] = value;
      }
      return convertedRow;
    });
  }
  
  /**
   * Get a single license by ID
   */
  async getLicenseById(id: number) {
    const query = `
      SELECT * 
      FROM nuxi_dev_licenses 
      WHERE "id" = $1
    `;
    
    const results = await executeRawQuery(query, [id]);
    const licenses = results as any[];
    
    if (licenses.length === 0) {
      return null;
    }
    
    // Convert snake_case to PascalCase for frontend compatibility
    const license = licenses[0];
    const convertedLicense: any = {};
    for (const [key, value] of Object.entries(license)) {
      // Convert snake_case to PascalCase
      const pascalKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Ensure first letter is capitalized
      const finalKey = pascalKey.charAt(0).toUpperCase() + pascalKey.slice(1);
      convertedLicense[finalKey] = value;
    }
    
    return convertedLicense;
  }
  
  /**
   * Create a new license
   */
  async createLicense(licenseData: any) {
    // Remove ID if it exists
    const { ID, ...dataWithoutId } = licenseData;
    
    // Prepare columns and values for the INSERT query
    const columns = Object.keys(dataWithoutId).map(key => {
      // Convert camelCase or PascalCase to snake_case for PostgreSQL
      return `"${key.replace(/([A-Z])/g, '_$1').toLowerCase()}"`;
    });
    
    const placeholders = Array.from({ length: columns.length }, (_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(dataWithoutId);
    
    const query = `
      INSERT INTO nuxi_dev_licenses (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const results = await executeRawQuery(query, values);
    const insertedRows = results as any[];
    
    if (insertedRows.length === 0) {
      throw new Error('Failed to create license');
    }
    
    // Convert snake_case to PascalCase for frontend compatibility
    const insertedLicense = insertedRows[0];
    const convertedLicense: any = {};
    for (const [key, value] of Object.entries(insertedLicense)) {
      // Convert snake_case to PascalCase
      const pascalKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Ensure first letter is capitalized
      const finalKey = pascalKey.charAt(0).toUpperCase() + pascalKey.slice(1);
      convertedLicense[finalKey] = value;
    }
    
    return convertedLicense;
  }
  
  /**
   * Update an existing license
   */
  async updateLicense(id: number, licenseData: any) {
    // Remove ID from the data to update
    const { ID, ...dataToUpdate } = licenseData;
    
    // Prepare SET clause for the UPDATE query
    const updates = Object.keys(dataToUpdate).map((key, index) => {
      // Convert camelCase or PascalCase to snake_case for PostgreSQL
      const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `"${columnName}" = $${index + 1}`;
    });
    
    const values = Object.values(dataToUpdate);
    
    // Add ID to values array
    values.push(id);
    
    const query = `
      UPDATE nuxi_dev_licenses
      SET ${updates.join(', ')}
      WHERE "id" = $${values.length}
      RETURNING *
    `;
    
    const results = await executeRawQuery(query, values);
    const updatedRows = results as any[];
    
    if (updatedRows.length === 0) {
      throw new Error('Failed to update license');
    }
    
    // Convert snake_case to PascalCase for frontend compatibility
    const updatedLicense = updatedRows[0];
    const convertedLicense: any = {};
    for (const [key, value] of Object.entries(updatedLicense)) {
      // Convert snake_case to PascalCase
      const pascalKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Ensure first letter is capitalized
      const finalKey = pascalKey.charAt(0).toUpperCase() + pascalKey.slice(1);
      convertedLicense[finalKey] = value;
    }
    
    return convertedLicense;
  }
}

export const nuxiDevLicenseService = new NuxiDevLicenseService();
