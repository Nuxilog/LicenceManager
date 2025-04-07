import { executeRawQuery, getDb, describeTable } from '../db';
import { LicenseFilters, SortConfig } from '../../client/src/types/license';
import { nuxiDevLicenses } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Détecter si on utilise MySQL
const useMySQL = process.env.DB_HOST ? true : false;

// Ne pas appeler automatiquement au démarrage pour éviter de bloquer l'initialisation
// Définissons une fonction qui peut être appelée plus tard
async function exploreTableStructure() {
  if (useMySQL) {
    const tableName = process.env.LICENSE_TABLE_NAME || 'nuxi_dev_licenses';
    try {
      // Récupérer la structure de la table pour connaître les noms de colonnes réels
      await describeTable(tableName);
    } catch (err) {
      console.error("Impossible d'examiner la structure de la table:", err);
    }
  }
}

class NuxiDevLicenseService {
  // Récupérer le nom de table depuis les variables d'environnement ou utiliser la valeur par défaut
  private tableName = process.env.LICENSE_TABLE_NAME || 'nuxi_dev_licenses';
  
  /**
   * Get licenses with optional filtering and sorting
   */
  async getLicenses(filters: LicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 10) {
    // Log received filters for debugging
    console.log('Received filters:', JSON.stringify(filters));
    console.log('Received sort config:', JSON.stringify(sortConfig));
    console.log('Page:', page, 'Page size:', pageSize);
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * pageSize;
    
    // Build raw SQL query
    let query = `
      SELECT * 
      FROM ${this.tableName}
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    // Utiliser ? pour MySQL et $n pour PostgreSQL
    const paramPlaceholder = useMySQL ? '?' : `$\${queryParams.length + 1}`;
    
    // Apply filters
    if (filters.onlyNuxiDev) {
      if (!useMySQL) {
        // Pour PostgreSQL
        query += ` AND "NomSoft" = $${queryParams.length + 1}`;
        queryParams.push('NuxiDev');
      } else {
        // Pour MySQL
        query += ` AND NomSoft = ${paramPlaceholder}`;
        queryParams.push('NuxiDev');
      }
      console.log('Added filter for NuxiDev only');
    }
    
    if (filters.idClient) {
      if (!useMySQL) {
        query += ` AND "IDClient" = $${queryParams.length + 1}`;
      } else {
        query += ` AND IDClient = ${paramPlaceholder}`;
      }
      queryParams.push(filters.idClient);
      console.log('Added filter for idClient:', filters.idClient);
    }
    
    if (filters.idSynchro) {
      if (!useMySQL) {
        query += ` AND "IDSynchro" = $${queryParams.length + 1}`;
      } else {
        query += ` AND IDSynchro = ${paramPlaceholder}`;
      }
      queryParams.push(filters.idSynchro);
      console.log('Added filter for idSynchro:', filters.idSynchro);
    }
    
    if (filters.serial) {
      if (!useMySQL) {
        query += ` AND "Serial" LIKE $${queryParams.length + 1}`;
      } else {
        query += ` AND Serial LIKE ${paramPlaceholder}`;
      }
      queryParams.push(`%${filters.serial}%`);
      console.log('Added filter for serial containing:', filters.serial);
    }
    
    if (filters.identifiantPC) {
      if (!useMySQL) {
        query += ` AND "IdentifiantPC" LIKE $${queryParams.length + 1}`;
      } else {
        query += ` AND IdentifiantPC LIKE ${paramPlaceholder}`;
      }
      queryParams.push(`%${filters.identifiantPC}%`);
      console.log('Added filter for identifiantPC containing:', filters.identifiantPC);
    }
    
    // For MySQL, we use the original column names as they appear in the database
    // In this database, we don't convert to snake_case
    let sortKey = sortConfig.key;
    
    // Special case for ID - this is the only column that uses lowercase
    if (sortKey === 'ID' && useMySQL) {
      sortKey = 'id';
    }
    
    console.log('Sorting by:', sortConfig.key, '-> using DB column:', sortKey);
    
    // Ne pas entourer les noms de colonnes avec des guillemets pour MySQL
    if (useMySQL) {
      query += ` ORDER BY ${sortKey} ${sortConfig.direction.toUpperCase()}`;
    } else {
      query += ` ORDER BY "${sortKey}" ${sortConfig.direction.toUpperCase()}`;
    }
    
    // Ajout de la pagination
    if (useMySQL) {
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    } else {
      query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }
    
    // Log final query and parameters
    console.log('Executing SQL query:', query);
    console.log('With parameters:', queryParams);
    
    // Execute query
    const results = await executeRawQuery(query, queryParams);
    
    // Convert snake_case to PascalCase for frontend compatibility
    return results.map((row: any) => {
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
    // Adapter la syntaxe SQL en fonction du type de base de données
    const query = useMySQL 
      ? `
          SELECT * 
          FROM ${this.tableName} 
          WHERE id = ?
        `
      : `
          SELECT * 
          FROM ${this.tableName} 
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
        return useMySQL ? 'id' : '"id"';
      }
      
      // Convert properly PascalCase to snake_case (first letter lowercase, rest with underscore)
      const columnName = key.charAt(0).toLowerCase() + 
                        key.slice(1).replace(/([A-Z])/g, '_$1').toLowerCase();
      
      console.log('Converting property:', key, '-> to DB column:', columnName);
      
      // Enlever les guillemets pour MySQL
      return useMySQL ? `${columnName}` : `"${columnName}"`;
    });
    
    const values = Object.values(dataWithoutId);
    
    let placeholders;
    if (useMySQL) {
      // Utiliser ? pour les paramètres en MySQL
      placeholders = Array(columns.length).fill('?').join(', ');
    } else {
      // Utiliser $n pour les paramètres en PostgreSQL
      placeholders = Array.from({ length: columns.length }, (_, i) => `$${i + 1}`).join(', ');
    }
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ${useMySQL ? '' : 'RETURNING *'}
    `;
    
    const results = await executeRawQuery(query, values);
    
    // Pour MySQL, faire une requête supplémentaire pour obtenir la ligne insérée
    if (useMySQL) {
      // On suppose que la dernière insertion a été réussie et que nous pouvons obtenir l'ID généré
      const insertId = (results as any).insertId;
      if (insertId) {
        const selectQuery = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const selectResults = await executeRawQuery(selectQuery, [insertId]);
        const insertedRows = selectResults as any[];
        return insertedRows;
      }
    }
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
      
      // Différent format selon la base de données
      if (useMySQL) {
        return `${columnName} = ?`;
      } else {
        return `"${columnName}" = $${index + 1}`;
      }
    });
    
    const values = Object.values(dataToUpdate);
    
    // Add ID to values array
    values.push(id);
    
    const query = useMySQL
      ? `
          UPDATE ${this.tableName}
          SET ${updates.join(', ')}
          WHERE id = ?
        `
      : `
          UPDATE ${this.tableName}
          SET ${updates.join(', ')}
          WHERE "id" = $${values.length}
          RETURNING *
        `;
    
    const results = await executeRawQuery(query, values);
    
    // Pour MySQL, faire une requête supplémentaire pour obtenir la ligne mise à jour
    if (useMySQL) {
      const selectQuery = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const selectResults = await executeRawQuery(selectQuery, [id]);
      const updatedRows = selectResults as any[];
      return updatedRows;
    }
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
