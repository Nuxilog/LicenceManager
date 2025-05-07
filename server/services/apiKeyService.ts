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
      
      // Pour les filtres showInactive et showExpired, nous n'avons pas de colonnes directes pour ça
      // Nous pourrions peut-être utiliser Der_Utilisation pour une logique similaire, mais pour l'instant
      // nous ne filtrerons pas par ces critères
      
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
      return results.map((row: any) => ({
        ID: row.id,
        ClientID: row.id_client,
        ApiKey: row.api_key,
        Description: row.description,
        CreatedAt: row.created_at,
        ExpiresAt: row.expires_at,
        IsActive: row.is_active
      }));
      
    } catch (error) {
      console.error('Error getting API licenses:', error);
      throw error;
    }
  }

  // Récupérer une licence par son ID
  async getLicenseById(id: number) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const results = await executeRawQuery(query, [id]);
      
      // Vérifier si les résultats sont un tableau
      if (!Array.isArray(results) || results.length === 0) {
        return null;
      }
      
      const row = results[0];
      return {
        ID: row.id,
        ClientID: row.id_client,
        ApiKey: row.api_key,
        Description: row.description,
        CreatedAt: row.created_at,
        ExpiresAt: row.expires_at,
        IsActive: row.is_active
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
        (id_client, api_key, description, created_at, expires_at, is_active) 
        VALUES (?, ?, ?, NOW(), ?, ?)
      `;
      
      const params = [
        licenseData.ClientID,
        licenseData.ApiKey,
        licenseData.Description,
        licenseData.ExpiresAt,
        licenseData.IsActive
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
        SET id_client = ?, 
            api_key = ?, 
            description = ?, 
            expires_at = ?, 
            is_active = ? 
        WHERE id = ?
      `;
      
      const params = [
        licenseData.ClientID,
        licenseData.ApiKey,
        licenseData.Description,
        licenseData.ExpiresAt,
        licenseData.IsActive,
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