import { executeRawQuery, getDb, describeTable } from '../db';
import { LicenseFilters, SortConfig } from '../../client/src/types/license';
import { nuxiDevLicenses } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { ftpService } from './ftpService';
import { log } from '../vite';

// Toujours utiliser MySQL
const useMySQL = true;

// Ne pas appeler automatiquement au démarrage pour éviter de bloquer l'initialisation
// Définissons une fonction qui peut être appelée plus tard
async function exploreTableStructure() {
  const tableName = process.env.LICENSE_TABLE_NAME || 'nuxi_dev_licenses';
  try {
    // Récupérer la structure de la table pour connaître les noms de colonnes réels
    await describeTable(tableName);
  } catch (err) {
    console.error("Impossible d'examiner la structure de la table:", err);
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
    
    // Utiliser ? comme placeholder pour MySQL
    const paramPlaceholder = '?';
    
    // Apply filters
    if (filters.onlyNuxiDev) {
      query += ` AND NomSoft = ${paramPlaceholder}`;
      queryParams.push('NuxiDev');
      console.log('Added filter for NuxiDev only');
    }
    
    if (filters.idClient) {
      query += ` AND IDClient = ${paramPlaceholder}`;
      queryParams.push(filters.idClient);
      console.log('Added filter for idClient (exacte):', filters.idClient);
    }
    
    if (filters.idSynchro) {
      query += ` AND IDSynchro LIKE ${paramPlaceholder}`;
      queryParams.push(`%${filters.idSynchro}%`);
      console.log('Added filter for idSynchro (contient):', filters.idSynchro);
    }
    
    if (filters.serial) {
      query += ` AND Serial = ${paramPlaceholder}`;
      queryParams.push(filters.serial);
      console.log('Added filter for serial (exacte):', filters.serial);
    }
    
    if (filters.identifiantPC) {
      query += ` AND IdentifiantPC LIKE ${paramPlaceholder}`;
      queryParams.push(`%${filters.identifiantPC}%`);
      console.log('Added filter for identifiantPC (contient):', filters.identifiantPC);
    }
    
    // In this database, we use the original column names as they appear
    let sortKey = sortConfig.key;
    
    // Special case for ID - this is the only column that uses lowercase
    if (sortKey === 'ID') {
      sortKey = 'id';
    }
    
    console.log('Sorting by:', sortConfig.key, '-> using DB column:', sortKey);
    
    // Ne pas entourer les noms de colonnes avec des guillemets pour MySQL
    query += ` ORDER BY ${sortKey} ${sortConfig.direction.toUpperCase()}`;
    
    // Ajout de la pagination
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    
    // Log final query and parameters
    console.log('Executing SQL query:', query);
    console.log('With parameters:', queryParams);
    
    // Execute query
    const results = await executeRawQuery(query, queryParams);
    // Cast des résultats en tableau pour utiliser map
    const licenses = results as any[];
    
    // Convert snake_case to PascalCase for frontend compatibility
    return licenses.map((row: any) => {
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
    // Requête SQL pour récupérer une licence par son ID
    const query = `
        SELECT * 
        FROM ${this.tableName} 
        WHERE id = ?
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
      let columnName;
      
      // Conserver le nom exact de la colonne, juste cas spécial pour ID
      if (key === 'ID') {
        columnName = 'id'; // seul cas particulier
      } else {
        columnName = key; // garder le nom tel quel
      }
      
      console.log('Converting property:', key, '-> to DB column:', columnName);
      
      return `${columnName}`;
    });
    
    const values = Object.values(dataWithoutId);
    
    // Utiliser ? pour les paramètres en MySQL
    const placeholders = Array(columns.length).fill('?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;
    
    const results = await executeRawQuery(query, values);
    
    // Pour MySQL, faire une requête supplémentaire pour obtenir la ligne insérée
    // On suppose que la dernière insertion a été réussie et que nous pouvons obtenir l'ID généré
    const insertId = (results as any).insertId;
    if (!insertId) {
      throw new Error('Failed to create license: no insertId returned');
    }
    
    const selectQuery = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const selectResults = await executeRawQuery(selectQuery, [insertId]);
    const insertedRows = selectResults as any[];
    
    if (insertedRows.length === 0) {
      throw new Error('Failed to retrieve created license');
    }
    
    // Gérer l'upload FTP pour les fichiers .htaccess et .htmdp
    const insertedLicense = insertedRows[0];
    if (insertedLicense && insertedLicense.IDSynchro && insertedLicense.FTP1_Hote && insertedLicense.Secu2Srv1) {
      try {
        log(`Génération des fichiers de sécurité FTP pour la licence #${insertId} (ID de Synchro: ${insertedLicense.IDSynchro})`, 'licenseService');
        const ftpResult = await ftpService.uploadSecurityFiles(
          insertedLicense.FTP1_Hote, 
          insertedLicense.IDSynchro, 
          insertedLicense.Secu2Srv1
        );
        
        if (ftpResult) {
          log(`Fichiers de sécurité FTP générés et uploadés avec succès pour la licence #${insertId}`, 'licenseService');
        } else {
          log(`Erreur lors de la génération ou de l'upload des fichiers de sécurité FTP pour la licence #${insertId}`, 'licenseService');
        }
      } catch (error) {
        log(`Exception lors de l'upload FTP: ${error instanceof Error ? error.message : String(error)}`, 'licenseService');
      }
    } else {
      log(`Informations FTP incomplètes pour la licence #${insertId}, aucun fichier de sécurité généré`, 'licenseService');
    }
    
    // Convert snake_case to PascalCase for frontend compatibility
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
    const updates = Object.keys(dataToUpdate).map(key => {
      let columnName;
      
      // Conserver le nom exact de la colonne, juste cas spécial pour ID
      if (key === 'ID') {
        columnName = 'id'; // seul cas particulier
      } else {
        columnName = key; // garder le nom tel quel
      }
      
      console.log('UPDATE - Converting property:', key, '-> to DB column:', columnName);
      
      return `${columnName} = ?`;
    });
    
    const values = Object.values(dataToUpdate);
    
    // Add ID to values array
    values.push(id);
    
    const query = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
    
    const results = await executeRawQuery(query, values);
    
    // Vérifier si l'update a bien fonctionné en regardant affectedRows
    if ((results as any).affectedRows === 0) {
      throw new Error(`Failed to update license #${id}: no rows affected`);
    }
    
    // Faire une requête supplémentaire pour obtenir la ligne mise à jour
    const selectQuery = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const selectResults = await executeRawQuery(selectQuery, [id]);
    const updatedRows = selectResults as any[];
    
    if (updatedRows.length === 0) {
      throw new Error(`Failed to retrieve updated license #${id}`);
    }
    
    // Gérer l'upload FTP pour les fichiers .htaccess et .htmdp
    const updatedLicense = updatedRows[0];
    if (updatedLicense && updatedLicense.IDSynchro && updatedLicense.FTP1_Hote && updatedLicense.Secu2Srv1) {
      try {
        log(`Mise à jour des fichiers de sécurité FTP pour la licence #${id} (ID de Synchro: ${updatedLicense.IDSynchro})`, 'licenseService');
        const ftpResult = await ftpService.uploadSecurityFiles(
          updatedLicense.FTP1_Hote, 
          updatedLicense.IDSynchro, 
          updatedLicense.Secu2Srv1
        );
        
        if (ftpResult) {
          log(`Fichiers de sécurité FTP mis à jour avec succès pour la licence #${id}`, 'licenseService');
        } else {
          log(`Erreur lors de la mise à jour des fichiers de sécurité FTP pour la licence #${id}`, 'licenseService');
        }
      } catch (error) {
        log(`Exception lors de l'upload FTP: ${error instanceof Error ? error.message : String(error)}`, 'licenseService');
      }
    } else {
      log(`Informations FTP incomplètes pour la licence #${id}, aucun fichier de sécurité mis à jour`, 'licenseService');
    }
    
    // Convert snake_case to PascalCase for frontend compatibility
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

  /**
   * Vérifie si un ID de Synchro existe déjà dans la base de données
   * Retourne les licences qui utilisent déjà cet ID (sauf celle avec l'ID en param)
   */
  async checkIfIDSynchroExists(idSynchro: string, excludeLicenseId?: number) {
    if (!idSynchro) return [];
    
    console.log(`Vérification de l'unicité de l'ID de Synchro: ${idSynchro}, excluant l'ID: ${excludeLicenseId || 'aucun'}`);
    
    // Requête SQL pour vérifier l'existence d'un ID Synchro
    let query = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE IDSynchro = ?
    `;
    
    let params: any[] = [idSynchro];
    
    // Si on exclut une licence spécifique (pour les mises à jour)
    if (excludeLicenseId) {
      query += ` AND id != ?`;
      params.push(excludeLicenseId);
    }
    
    const results = await executeRawQuery(query, params);
    const licenses = results as any[];
    
    console.log(`Résultat de la vérification: ${licenses.length} licence(s) avec le même IDSynchro trouvée(s)`);
    
    // Convert snake_case to PascalCase for frontend compatibility
    return licenses.map((license) => {
      const convertedLicense: any = {};
      for (const [key, value] of Object.entries(license)) {
        // Convert snake_case to PascalCase
        const pascalKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        // Ensure first letter is capitalized
        const finalKey = pascalKey.charAt(0).toUpperCase() + pascalKey.slice(1);
        convertedLicense[finalKey] = value;
      }
      return convertedLicense;
    });
  }
}

export const nuxiDevLicenseService = new NuxiDevLicenseService();
