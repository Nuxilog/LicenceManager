import { db } from '../db';
import { LicenseFilters, SortConfig } from '../../client/src/types/license';

class NuxiDevLicenseService {
  /**
   * Get licenses with optional filtering and sorting
   */
  async getLicenses(filters: LicenseFilters, sortConfig: SortConfig) {
    let query = `
      SELECT * 
      FROM licenses
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Apply filters
    if (filters.onlyNuxiDev) {
      query += ` AND NomSoft = ?`;
      queryParams.push('NuxiDev');
    }
    
    if (filters.idClient) {
      query += ` AND IDClient = ?`;
      queryParams.push(filters.idClient);
    }
    
    if (filters.idSynchro) {
      query += ` AND IDSynchro = ?`;
      queryParams.push(filters.idSynchro);
    }
    
    if (filters.serial) {
      query += ` AND Serial LIKE ?`;
      queryParams.push(`%${filters.serial}%`);
    }
    
    if (filters.identifiantPC) {
      query += ` AND IdentifiantPC LIKE ?`;
      queryParams.push(`%${filters.identifiantPC}%`);
    }
    
    // Apply sorting
    query += ` ORDER BY ${sortConfig.key} ${sortConfig.direction.toUpperCase()}`;
    
    // Execute query
    const results = await db.nuxiDev.query(query, queryParams);
    return results;
  }
  
  /**
   * Get a single license by ID
   */
  async getLicenseById(id: number) {
    const query = `
      SELECT * 
      FROM licenses 
      WHERE ID = ?
    `;
    
    const results = await db.nuxiDev.query(query, [id]);
    const licenses = results as any[];
    
    return licenses.length > 0 ? licenses[0] : null;
  }
  
  /**
   * Create a new license
   */
  async createLicense(licenseData: any) {
    // Prepare columns and values for the INSERT query
    const columns = Object.keys(licenseData).filter(key => key !== 'ID');
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => licenseData[col]);
    
    const query = `
      INSERT INTO licenses (${columns.join(', ')})
      VALUES (${placeholders})
    `;
    
    const result = await db.nuxiDev.query(query, values);
    const insertResult = result as any;
    
    // Get the newly created license
    if (insertResult.insertId) {
      return this.getLicenseById(insertResult.insertId);
    }
    
    throw new Error('Failed to create license');
  }
  
  /**
   * Update an existing license
   */
  async updateLicense(id: number, licenseData: any) {
    // Prepare SET clause for the UPDATE query
    const updates = Object.entries(licenseData)
      .filter(([key]) => key !== 'ID')
      .map(([key]) => `${key} = ?`);
    
    const values = Object.entries(licenseData)
      .filter(([key]) => key !== 'ID')
      .map(([_, value]) => value);
    
    // Add ID to values array
    values.push(id);
    
    const query = `
      UPDATE licenses
      SET ${updates.join(', ')}
      WHERE ID = ?
    `;
    
    await db.nuxiDev.query(query, values);
    
    // Get the updated license
    return this.getLicenseById(id);
  }
}

export const nuxiDevLicenseService = new NuxiDevLicenseService();
