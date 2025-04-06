import { db, executeRawQuery } from '../db';
import { LicenseFilters, SortConfig } from '../../client/src/types/license';
import { nuxiDevLicenses } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

class NuxiDevLicenseService {
  /**
   * Get licenses with optional filtering and sorting
   */
  async getLicenses(filters: LicenseFilters, sortConfig: SortConfig) {
    // Log received filters for debugging
    console.log('Received filters:', JSON.stringify(filters));
    console.log('Received sort config:', JSON.stringify(sortConfig));
    
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
      console.log('Added filter for NuxiDev only');
    }
    
    if (filters.idClient) {
      query += ` AND "id_client" = $${queryParams.length + 1}`;
      queryParams.push(filters.idClient);
      console.log('Added filter for idClient:', filters.idClient);
    }
    
    if (filters.idSynchro) {
      query += ` AND "id_synchro" = $${queryParams.length + 1}`;
      queryParams.push(filters.idSynchro);
      console.log('Added filter for idSynchro:', filters.idSynchro);
    }
    
    if (filters.serial) {
      query += ` AND "serial" LIKE $${queryParams.length + 1}`;
      queryParams.push(`%${filters.serial}%`);
      console.log('Added filter for serial containing:', filters.serial);
    }
    
    if (filters.identifiantPC) {
      query += ` AND "identifiant_pc" LIKE $${queryParams.length + 1}`;
      queryParams.push(`%${filters.identifiantPC}%`);
      console.log('Added filter for identifiantPC containing:', filters.identifiantPC);
    }
    
    // Convert the key for sorting (PascalCase to snake_case properly)
    let sortKey = sortConfig.key;
    // Special case for ID which needs to become "id" not "_i_d"
    if (sortKey === 'ID') {
      sortKey = 'id';
    } else {
      // First letter lowercase, then replace other uppercase with _lowercase
      sortKey = sortKey.charAt(0).toLowerCase() + 
                sortKey.slice(1).replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    console.log('Sorting by:', sortConfig.key, '-> converted to DB column:', sortKey);
    query += ` ORDER BY "${sortKey}" ${sortConfig.direction.toUpperCase()}`;
    
    // Log final query and parameters
    console.log('Executing SQL query:', query);
    console.log('With parameters:', queryParams);
    
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
      // Special case for ID which needs to become "id" not "_i_d"
      if (key === 'ID') {
        return '"id"';
      }
      
      // Convert properly PascalCase to snake_case (first letter lowercase, rest with underscore)
      const columnName = key.charAt(0).toLowerCase() + 
                        key.slice(1).replace(/([A-Z])/g, '_$1').toLowerCase();
      
      console.log('Converting property:', key, '-> to DB column:', columnName);
      return `"${columnName}"`;
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
      // Special case for ID which needs to become "id" not "_i_d"
      let columnName;
      if (key === 'ID') {
        columnName = 'id';
      } else {
        // Convert properly PascalCase to snake_case (first letter lowercase, rest with underscore)
        columnName = key.charAt(0).toLowerCase() + 
                    key.slice(1).replace(/([A-Z])/g, '_$1').toLowerCase();
      }
      
      console.log('UPDATE - Converting property:', key, '-> to DB column:', columnName);
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
