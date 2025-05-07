import { executeRawQuery, getDb, describeTable } from '../db';
import { LicenseFilters, SortConfig, StudioLicenseFilters } from '../../client/src/types/license';
import { nuxiDevLicenses, studioLicenses } from '@shared/schema';
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

class StudioLicenseService {
  // Nom de la table pour les licences Studio
  private tableName = 'LicencesStudio';
  
  /**
   * Get studio licenses with optional filtering and sorting
   */
  async getLicenses(filters: StudioLicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 10) {
    // Log received filters for debugging
    console.log('Received studio filters:', JSON.stringify(filters));
    console.log('Received sort config:', JSON.stringify(sortConfig));
    console.log('Page:', page, 'Page size:', pageSize);
    
    // Examiner la structure de la table
    try {
      const db = await import('../db');
      await db.describeTable(this.tableName);
    } catch (error) {
      console.error("Erreur lors de l'examen de la structure de la table LicencesStudio:", error);
    }
    
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
    if (filters.numClient) {
      query += ` AND NumClient = ${paramPlaceholder}`;
      queryParams.push(filters.numClient);
      console.log('Added filter for numClient (exacte):', filters.numClient);
    }
    
    if (filters.serial) {
      query += ` AND Serial LIKE ${paramPlaceholder}`;
      queryParams.push(`%${filters.serial}%`);
      console.log('Added filter for serial (contient):', filters.serial);
    }
    
    if (filters.identifiantUser) {
      query += ` AND IdentifiantUser LIKE ${paramPlaceholder}`;
      queryParams.push(`%${filters.identifiantUser}%`);
      console.log('Added filter for identifiantUser (contient):', filters.identifiantUser);
    }
    
    // Filtres pour les modules
    if (filters.onlyWithPDF) {
      query += ` AND PDF = 1`;
      console.log('Added filter for onlyWithPDF');
    }
    
    if (filters.onlyWithVue) {
      query += ` AND Vue = 1`;
      console.log('Added filter for onlyWithVue');
    }
    
    if (filters.onlyWithPagePerso) {
      query += ` AND PagePerso = 1`;
      console.log('Added filter for onlyWithPagePerso');
    }
    
    if (filters.onlyWithWDE) {
      query += ` AND WDE = 1`;
      console.log('Added filter for onlyWithWDE');
    }
    
    // Ne pas inclure les licences suspendues si spécifié
    if (filters.hideSuspended) {
      query += ` AND (Suspendu IS NULL OR Suspendu != 1)`;
      console.log('Hiding suspended licenses');
    }
    
    // In this database, use the Pascal case column names
    let sortKey = sortConfig.key;
    
    // Special case for ID - convert to IdLicencesStudio which is the primary key column name
    if (sortKey === 'ID') {
      sortKey = 'IdLicencesStudio';
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
    
    // Convertir les noms de colonnes pour la cohérence avec le frontend
    return licenses.map((row: any) => {
      const convertedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        // Cas spécial pour IdLicencesStudio -> ID
        if (key === 'IdLicencesStudio') {
          convertedRow['ID'] = value;
        } else {
          // Conserver tel quel
          convertedRow[key] = value;
        }
      }
      return convertedRow;
    });
  }
  
  /**
   * Get a single studio license by ID
   */
  async getLicenseById(id: number) {
    // Requête SQL pour récupérer une licence studio par son ID
    const query = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE IdLicencesStudio = ?
    `;
    
    const results = await executeRawQuery(query, [id]);
    const licenses = results as any[];
    
    if (licenses.length === 0) {
      return null;
    }
    
    // Convertir les noms de colonnes pour la cohérence avec le frontend
    const license = licenses[0];
    const convertedLicense: any = {};
    for (const [key, value] of Object.entries(license)) {
      // Cas spécial pour IdLicencesStudio -> ID
      if (key === 'IdLicencesStudio') {
        convertedLicense['ID'] = value;
      } else {
        // Conserver tel quel
        convertedLicense[key] = value;
      }
    }
    
    return convertedLicense;
  }
  
  /**
   * Create a new studio license
   */
  async createLicense(licenseData: any) {
    // Remove ID if it exists and handle special case for ID/IdLicencesStudio
    const { ID, ...dataToInsert } = licenseData;
    
    // Prepare columns and values for the INSERT query
    const columns = Object.keys(dataToInsert);
    const values = Object.values(dataToInsert);
    
    // Utiliser ? pour les paramètres en MySQL
    const placeholders = Array(columns.length).fill('?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;
    
    const results = await executeRawQuery(query, values);
    
    // Pour MySQL, faire une requête supplémentaire pour obtenir la ligne insérée
    const insertId = (results as any).insertId;
    if (!insertId) {
      throw new Error('Failed to create studio license: no insertId returned');
    }
    
    const selectQuery = `SELECT * FROM ${this.tableName} WHERE IdLicencesStudio = ?`;
    const selectResults = await executeRawQuery(selectQuery, [insertId]);
    const insertedRows = selectResults as any[];
    
    if (insertedRows.length === 0) {
      throw new Error('Failed to retrieve created studio license');
    }
    
    // Convertir les noms de colonnes pour la cohérence avec le frontend
    const insertedLicense = insertedRows[0];
    const convertedLicense: any = {};
    for (const [key, value] of Object.entries(insertedLicense)) {
      // Cas spécial pour IdLicencesStudio -> ID
      if (key === 'IdLicencesStudio') {
        convertedLicense['ID'] = value;
      } else {
        // Conserver tel quel
        convertedLicense[key] = value;
      }
    }
    
    return convertedLicense;
  }
  
  /**
   * Update an existing studio license
   */
  async updateLicense(id: number, licenseData: any) {
    // Remove ID from the data to update
    const { ID, ...dataToUpdate } = licenseData;
    
    // Prepare SET clause for the UPDATE query
    const updates = Object.keys(dataToUpdate).map(key => `${key} = ?`);
    const values = Object.values(dataToUpdate);
    
    // Add ID to values array
    values.push(id);
    
    const query = `
      UPDATE ${this.tableName}
      SET ${updates.join(', ')}
      WHERE IdLicencesStudio = ?
    `;
    
    const results = await executeRawQuery(query, values);
    
    // Vérifier si l'update a bien fonctionné en regardant affectedRows
    if ((results as any).affectedRows === 0) {
      throw new Error(`Failed to update studio license #${id}: no rows affected`);
    }
    
    // Faire une requête supplémentaire pour obtenir la ligne mise à jour
    const selectQuery = `SELECT * FROM ${this.tableName} WHERE IdLicencesStudio = ?`;
    const selectResults = await executeRawQuery(selectQuery, [id]);
    const updatedRows = selectResults as any[];
    
    if (updatedRows.length === 0) {
      throw new Error(`Failed to retrieve updated studio license #${id}`);
    }
    
    // Convertir les noms de colonnes pour la cohérence avec le frontend
    const updatedLicense = updatedRows[0];
    const convertedLicense: any = {};
    for (const [key, value] of Object.entries(updatedLicense)) {
      // Cas spécial pour IdLicencesStudio -> ID
      if (key === 'IdLicencesStudio') {
        convertedLicense['ID'] = value;
      } else {
        // Conserver tel quel
        convertedLicense[key] = value;
      }
    }
    
    return convertedLicense;
  }
}

export const studioLicenseService = new StudioLicenseService();

/**
 * Service pour la gestion des licences NuxiSav
 */
class NuxiSavLicenseService {
  private licencesTableName = 'Licences';
  private postesTableName = 'Postes';
  
  /**
   * Get NuxiSav licenses with optional filtering and sorting
   */
  async getLicenses(filters: NuxiSavLicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 15) {
    // Log received filters for debugging
    console.log('Received NuxiSav filters:', JSON.stringify(filters));
    console.log('Received sort config:', JSON.stringify(sortConfig));
    console.log('Page:', page, 'Page size:', pageSize);
    
    // Debugging - Examiner la structure de la table
    try {
      const { executeRawQuery } = await import('../db');
      console.log("Examining structure of table 'Licences'...");
      const columns = await executeRawQuery('DESCRIBE Licences');
      console.log("Columns in table 'Licences':", columns);
    } catch (error) {
      console.error("Error examining Licences table structure:", error);
    }
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * pageSize;
    
    // Build raw SQL query for Licences
    let query = `
      SELECT * 
      FROM ${this.licencesTableName}
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Appliquer les filtres
    if (filters.idClient) {
      query += ` AND IdClient = ?`;
      params.push(filters.idClient);
    }
    
    if (filters.identifiantWeb) {
      query += ` AND IdentifiantWeb LIKE ?`;
      params.push(`%${filters.identifiantWeb}%`);
    }
    
    if (filters.serial) {
      query += ` AND SerialPermanente LIKE ?`;
      params.push(`%${filters.serial}%`);
    }
    
    const optionFilters = [];
    if (filters.onlyWithAtel) optionFilters.push('Atel');
    if (filters.onlyWithTrck) optionFilters.push('Trck');
    if (filters.onlyWithTckWeb) optionFilters.push('TckWeb');
    if (filters.onlyWithAud) optionFilters.push('Aud');
    if (filters.onlyWithSdk) optionFilters.push('sdk');
    
    // Appliquer les filtres d'options si au moins un est sélectionné
    if (optionFilters.length > 0) {
      const optionConditions = optionFilters.map(option => {
        query += ` AND Options LIKE ?`;
        params.push(`%${option}%`);
        return ` Options LIKE ?`;
      });
    }
    
    if (filters.hideSuspended) {
      query += ` AND (Suspendu = 0 OR Suspendu IS NULL)`;
    }
    
    // Mapper la clé de tri frontend à la colonne DB correspondante
    const sortMap: { [key: string]: string } = {
      'ID': 'IdLicence',
      'IdClient': 'IdClient',
      'IdentifiantWeb': 'IdentifiantWeb',
      'SerialPermanente': 'SerialPermanente',
      'NbrPermanente': 'NbrPermanente',
      'Version': 'Version',
      'Suspendu': 'Suspendu'
    };
    
    // Appliquer le tri
    const dbSortColumn = sortMap[sortConfig.key] || 'IdLicence';
    console.log(`Sorting by: ${sortConfig.key} -> using DB column: ${dbSortColumn}`);
    query += ` ORDER BY ${dbSortColumn} ${sortConfig.direction.toUpperCase()}`;
    
    // Appliquer la pagination
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    
    console.log('Executing SQL query: ', query);
    console.log('With parameters:', params);
    
    try {
      // Exécuter la requête pour récupérer les licences
      const { executeRawQuery } = await import('../db');
      
      const licenses = await executeRawQuery(query, params);
      
      // Pour chaque licence, récupérer les postes associés
      const licensesWithPostes = await Promise.all(
        licenses.map(async (license: any) => {
          const postesQuery = `
            SELECT * FROM ${this.postesTableName}
            WHERE IDLicence = ?
          `;
          const postes = await executeRawQuery(postesQuery, [license.IdLicence]);
          
          return {
            ID: license.IdLicence,
            IdClient: license.IdClient,
            NomSoft: license.NomSoft,
            IdentifiantWeb: license.IdentifiantWeb,
            SerialPermanente: license.SerialPermanente,
            SerialFlotante: license.SerialFlotante,
            Options: license.Options,
            Suspendu: license.Suspendu,
            IDSynchro: license.IDSynchro,
            Der_Utilisation: license.Der_Utilisation,
            Version: license.Version,
            DateLimite: license.DateLimite,
            NbrPermanente: license.NbrPermanente || 0,
            NbrFlotante: license.NbrFlotante || 0,
            NbrSession: license.NbrSession || 0,
            Info: license.Info,
            Postes: postes.map((poste: any) => ({
              ID: poste.IdPoste,
              IDLicence: poste.IDLicence,
              Serial: poste.Serial,
              Emprunte_PC: poste.Emprunte_PC,
              Nom_Poste: poste.Nom_Poste,
              Nom_Session: poste.Nom_Session,
              Der_Utilisation: poste.Der_Utilisation,
              Version: poste.Version,
              Connecte: poste.Connecte
            }))
          };
        })
      );
      
      return licensesWithPostes;
    } catch (error) {
      console.error('Error fetching NuxiSav licenses:', error);
      return [];
    }
  }

  /**
   * Get a single NuxiSav license by ID with its postes
   */
  async getLicenseById(id: number) {
    try {
      // Importer la fonction executeRawQuery directement
      const { executeRawQuery } = await import('../db');
      
      // Récupérer la licence
      const licenseQuery = `
        SELECT * FROM ${this.licencesTableName}
        WHERE IdLicence = ?
      `;
      const licenses = await executeRawQuery(licenseQuery, [id]);
      
      if (licenses.length === 0) {
        return null;
      }
      
      const license = licenses[0];
      
      // Récupérer les postes associés
      const postesQuery = `
        SELECT * FROM ${this.postesTableName}
        WHERE IDLicence = ?
      `;
      const postes = await executeRawQuery(postesQuery, [id]);
      
      return {
        ID: license.IdLicence,
        IdClient: license.IdClient,
        NomSoft: license.NomSoft,
        IdentifiantWeb: license.IdentifiantWeb,
        SerialPermanente: license.SerialPermanente,
        SerialFlotante: license.SerialFlotante,
        Options: license.Options,
        Suspendu: license.Suspendu,
        IDSynchro: license.IDSynchro,
        Der_Utilisation: license.Der_Utilisation,
        Version: license.Version,
        DateLimite: license.DateLimite,
        NbrPermanente: license.NbrPermanente || 0,
        NbrFlotante: license.NbrFlotante || 0,
        NbrSession: license.NbrSession || 0,
        Info: license.Info,
        Postes: postes.map((poste: any) => ({
          ID: poste.IdPoste,
          IDLicence: poste.IDLicence,
          Serial: poste.Serial,
          Emprunte_PC: poste.Emprunte_PC,
          Nom_Poste: poste.Nom_Poste,
          Nom_Session: poste.Nom_Session,
          Der_Utilisation: poste.Der_Utilisation,
          Version: poste.Version,
          Connecte: poste.Connecte
        }))
      };
    } catch (error) {
      console.error('Error fetching NuxiSav license by ID:', error);
      return null;
    }
  }

  /**
   * Create a new NuxiSav license
   */
  async createLicense(licenseData: any) {
    try {
      const { executeRawQuery } = await import('../db');
      
      const { Postes, ...licenseFields } = licenseData;
      
      // Insérer la licence
      const insertQuery = `
        INSERT INTO ${this.licencesTableName} 
        (IdClient, NomSoft, IdentifiantWeb, SerialPermanente, SerialFlotante, Options, 
         Suspendu, IDSynchro, Version, DateLimite, NbrPermanente, NbrFlotante, NbrSession, Info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await executeRawQuery(insertQuery, [
        licenseFields.IdClient,
        licenseFields.NomSoft,
        licenseFields.IdentifiantWeb,
        licenseFields.SerialPermanente,
        licenseFields.SerialFlotante,
        licenseFields.Options,
        licenseFields.Suspendu || 0,
        licenseFields.IDSynchro,
        licenseFields.Version,
        licenseFields.DateLimite,
        licenseFields.NbrPermanente || 0,
        licenseFields.NbrFlotante || 0,
        licenseFields.NbrSession || 0,
        licenseFields.Info
      ]);
      
      const licenseId = result.insertId;
      
      // Créer les postes associés
      if (Postes && Array.isArray(Postes)) {
        await this.updatePostes(licenseId, Postes);
      }
      
      // Récupérer la licence créée avec ses postes
      return this.getLicenseById(licenseId);
    } catch (error) {
      console.error('Error creating NuxiSav license:', error);
      throw error;
    }
  }

  /**
   * Update an existing NuxiSav license
   */
  async updateLicense(id: number, licenseData: any) {
    try {
      const { executeRawQuery } = await import('../db');
      
      const { Postes, ...licenseFields } = licenseData;
      
      // Mettre à jour la licence
      const updateQuery = `
        UPDATE ${this.licencesTableName} 
        SET IdClient = ?, NomSoft = ?, IdentifiantWeb = ?, SerialPermanente = ?, SerialFlotante = ?,
            Options = ?, Suspendu = ?, IDSynchro = ?, Version = ?, DateLimite = ?,
            NbrPermanente = ?, NbrFlotante = ?, NbrSession = ?, Info = ?
        WHERE IdLicence = ?
      `;
      
      await executeRawQuery(updateQuery, [
        licenseFields.IdClient,
        licenseFields.NomSoft,
        licenseFields.IdentifiantWeb,
        licenseFields.SerialPermanente,
        licenseFields.SerialFlotante,
        licenseFields.Options,
        licenseFields.Suspendu || 0,
        licenseFields.IDSynchro,
        licenseFields.Version,
        licenseFields.DateLimite,
        licenseFields.NbrPermanente || 0,
        licenseFields.NbrFlotante || 0,
        licenseFields.NbrSession || 0,
        licenseFields.Info,
        id
      ]);
      
      // Mettre à jour les postes associés
      if (Postes && Array.isArray(Postes)) {
        await this.updatePostes(id, Postes);
      }
      
      // Récupérer la licence mise à jour avec ses postes
      return this.getLicenseById(id);
    } catch (error) {
      console.error('Error updating NuxiSav license:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les postes d'une licence
   * Cette fonction gère la création, mise à jour et suppression des postes
   */
  private async updatePostes(licenseId: number, postes: any[]) {
    try {
      const { executeRawQuery } = await import('../db');
      // Récupérer les postes existants pour cette licence
      const existingPostesQuery = `
        SELECT * FROM ${this.postesTableName}
        WHERE IDLicence = ?
      `;
      const existingPostes = await executeRawQuery(existingPostesQuery, [licenseId]);
      
      const existingPosteIds = existingPostes.map((p: any) => p.IdPoste);
      
      // Identifier les postes à ajouter, mettre à jour, ou supprimer
      const postesToUpdate = postes.filter(p => p.ID > 0).map(p => ({ ...p, IdPoste: p.ID }));
      const postesToAdd = postes.filter(p => p.ID < 0 || !p.ID);
      const posteIdsToKeep = postesToUpdate.map(p => p.IdPoste);
      const posteIdsToDelete = existingPosteIds.filter(id => !posteIdsToKeep.includes(id));
      
      // Supprimer les postes qui ne sont plus nécessaires
      if (posteIdsToDelete.length > 0) {
        const deleteQuery = `
          DELETE FROM ${this.postesTableName}
          WHERE IDLicence = ? AND IdPoste IN (?)
        `;
        await executeRawQuery(deleteQuery, [licenseId, posteIdsToDelete]);
      }
      
      // Mettre à jour les postes existants
      for (const poste of postesToUpdate) {
        const updatePosteQuery = `
          UPDATE ${this.postesTableName}
          SET Serial = ?, Emprunte_PC = ?, Nom_Poste = ?, Nom_Session = ?,
              Der_Utilisation = ?, Version = ?, Connecte = ?
          WHERE IdPoste = ? AND IDLicence = ?
        `;
        // Formater correctement Der_Utilisation pour MySQL (format YYYY-MM-DD HH:MM:SS)
        let derUtilisation = null;
        if (poste.Der_Utilisation) {
          // Si c'est une chaîne ISO, convertir au format MySQL
          if (typeof poste.Der_Utilisation === 'string') {
            const date = new Date(poste.Der_Utilisation);
            derUtilisation = date.toISOString().slice(0, 19).replace('T', ' ');
          } else {
            derUtilisation = poste.Der_Utilisation;
          }
        }
        
        await executeRawQuery(updatePosteQuery, [
          poste.Serial,
          poste.Emprunte_PC,
          poste.Nom_Poste,
          poste.Nom_Session,
          derUtilisation,
          poste.Version,
          poste.Connecte || 0,
          poste.IdPoste,
          licenseId
        ]);
      }
      
      // Ajouter les nouveaux postes
      for (const poste of postesToAdd) {
        const insertPosteQuery = `
          INSERT INTO ${this.postesTableName}
          (IDLicence, Serial, Emprunte_PC, Nom_Poste, Nom_Session, Der_Utilisation, Version, Connecte)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // Formater correctement Der_Utilisation pour MySQL (format YYYY-MM-DD HH:MM:SS)
        let derUtilisation = null;
        if (poste.Der_Utilisation) {
          // Si c'est une chaîne ISO, convertir au format MySQL
          if (typeof poste.Der_Utilisation === 'string') {
            const date = new Date(poste.Der_Utilisation);
            derUtilisation = date.toISOString().slice(0, 19).replace('T', ' ');
          } else {
            derUtilisation = poste.Der_Utilisation;
          }
        }
        
        await executeRawQuery(insertPosteQuery, [
          licenseId,
          poste.Serial,
          poste.Emprunte_PC,
          poste.Nom_Poste,
          poste.Nom_Session,
          derUtilisation,
          poste.Version,
          poste.Connecte || 0
        ]);
      }
    } catch (error) {
      console.error('Error updating NuxiSav postes:', error);
      throw error;
    }
  }
}

export const nuxiSavLicenseService = new NuxiSavLicenseService();
