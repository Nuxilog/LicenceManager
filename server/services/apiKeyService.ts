import { executeRawQuery, describeTable } from '../db';
import { SortConfig } from '@/types/license';

class ApiKeyService {
  private tableName = 'API'; // Nom de la table en majuscules tel qu'il existe dans la base de données

  // Fonction pour explorer la structure de la table
  async exploreTableStructure() {
    try {
      console.log(`Examining structure of table '${this.tableName}'...`);
      const tableStructure = await describeTable(this.tableName);
      console.log(`Columns in table '${this.tableName}':`, tableStructure);
      return tableStructure;
    } catch (error) {
      console.error(`Error exploring table structure for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Fonction pour récupérer les licences API avec filtrage et tri
  async getLicenses(filters: any, sortConfig: SortConfig, page: number = 1, pageSize: number = 15) {
    try {
      // Construire la requête SQL de base
      let query = `
      SELECT * 
      FROM ${this.tableName}
      WHERE 1=1
     `;
      
      const queryParams: any[] = [];
      
      // Ajouter les conditions de filtrage
      if (filters.clientId) {
        query += ` AND ID_Client LIKE ?`;
        queryParams.push(`%${filters.clientId}%`);
      }
      
      if (filters.apiKey) {
        query += ` AND Api_Key LIKE ?`;
        queryParams.push(`%${filters.apiKey}%`);
      }
      
      // Nouveau filtre par numéro de série
      if (filters.serial) {
        query += ` AND Serial LIKE ?`;
        queryParams.push(`%${filters.serial}%`);
      }
      
      // Filtre pour les licences épuisées (quantité <= 0)
      if (filters.onlyExpired === 'true') {
        query += ` AND Qte <= 0`;
      }
      // Si onlyExpired n'est pas 'true', ne pas filtrer par quantité
      
      // Filtre pour les licences inactives avec "STOP" dans la restriction
      if (filters.showInactive === 'false') {
        query += ` AND Restriction NOT LIKE '%stop%'`;
      }
      
      // Ajouter le tri
      const dbColumnMap: { [key: string]: string } = {
        'ID': 'ID_Api',
        'ClientID': 'ID_Client',
        'ApiKey': 'Api_Key',
        'Serial': 'Serial',
        'LastUsed': 'Der_Utilisation',
        'Quantity': 'Qte'
      };
      
      const dbColumn = dbColumnMap[sortConfig.key] || 'id';
      console.log(`Sorting by: ${sortConfig.key} -> using DB column: ${dbColumn}`);
      
      query += ` ORDER BY ${dbColumn} ${sortConfig.direction === 'asc' ? 'ASC' : 'DESC'}`;
      
      // Ajouter la pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(pageSize);
      queryParams.push((page - 1) * pageSize);
      
      console.log('Executing SQL query:', query);
      console.log('With parameters:', queryParams);
      
      // Exécuter la requête
      const results = await executeRawQuery(query, queryParams);
      
      // Vérifier si les résultats sont un tableau
      if (!Array.isArray(results)) {
        console.warn('Unexpected result format from API query', results);
        return [];
      }
      
      // Transformer les résultats pour correspondre au format attendu par le frontend
      // Utilisation d'une assertion de type pour éviter les erreurs TypeScript
      return (results as any[]).map((row) => ({
        ID: row.ID_Api,
        ClientID: row.ID_Client,
        Serial: row.Serial,
        ApiKey: row.Api_Key,
        ApiKeyV5: row.Api_Key_V5,
        Quantity: row.Qte,
        LastUsed: row.Der_Utilisation,
        Restriction: row.Restriction
      }));
      
    } catch (error) {
      console.error('Error getting API licenses:', error);
      throw error;
    }
  }

  // Récupérer une licence par son ID
  async getLicenseById(id: number) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE ID_Api = ?`;
      const results = await executeRawQuery(query, [id]);
      
      // Vérifier si les résultats sont un tableau
      if (!Array.isArray(results) || results.length === 0) {
        return null;
      }
      
      // Effectuer une assertion de type pour éviter les erreurs TypeScript
      const row = results[0] as any;
      return {
        ID: row.ID_Api,
        ClientID: row.ID_Client,
        Serial: row.Serial,
        ApiKey: row.Api_Key,
        ApiKeyV5: row.Api_Key_V5,
        Quantity: row.Qte,
        LastUsed: row.Der_Utilisation,
        Restriction: row.Restriction
      };
      
    } catch (error) {
      console.error(`Error getting API license with ID ${id}:`, error);
      throw error;
    }
  }

  // Créer une nouvelle licence API
  async createLicense(licenseData: any) {
    try {
      const query = `
        INSERT INTO ${this.tableName} 
        (ID_Client, Serial, Api_Key, Api_Key_V5, Qte, Restriction) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        licenseData.ClientID,
        licenseData.Serial || licenseData.Serial,
        licenseData.ApiKey,
        licenseData.ApiKeyV5 || '',
        licenseData.Quantity || 0,
        licenseData.Restriction || ''
      ];
      
      const result = await executeRawQuery(query, params);
      
      // Si le résultat est un objet avec une propriété insertId
      if (result && typeof result === 'object' && 'insertId' in result) {
        return {
          ...licenseData,
          ID: result.insertId
        };
      }
      
      // Sinon, retourner simplement les données d'origine
      return {
        ...licenseData
      };
      
    } catch (error) {
      console.error('Error creating API license:', error);
      throw error;
    }
  }

  // Mettre à jour une licence existante
  async updateLicense(id: number, licenseData: any) {
    try {
      const query = `
        UPDATE ${this.tableName} 
        SET ID_Client = ?, 
            Serial = ?, 
            Api_Key = ?, 
            Api_Key_V5 = ?, 
            Qte = ?, 
            Restriction = ? 
        WHERE ID_Api = ?
      `;
      
      const params = [
        licenseData.ClientID,
        licenseData.Serial,
        licenseData.ApiKey,
        licenseData.ApiKeyV5 || '',
        licenseData.Quantity || 0,
        licenseData.Restriction || '',
        id
      ];
      
      await executeRawQuery(query, params);
      
      return {
        ...licenseData,
        ID: id
      };
      
    } catch (error) {
      console.error(`Error updating API license with ID ${id}:`, error);
      throw error;
    }
  }
}

export const apiKeyService = new ApiKeyService();