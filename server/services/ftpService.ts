import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { log } from '../vite';

// Interface pour les informations FTP du serveur
interface FtpServerInfo {
  host: string;
  user: string;
  password: string;
  basePath: string;
}

// Interface pour les fichiers à télécharger
interface FileToUpload {
  name: string;
  content: string;
}

class FtpService {
  /**
   * Détermine les informations FTP en fonction de l'hôte FTP
   */
  private getFtpServerInfo(ftpHost: string): FtpServerInfo | null {
    // Extraire le domaine à partir de l'URL FTP
    const ftpHostDomain = ftpHost.replace('ftp://', '').trim();
    
    if (ftpHostDomain.includes('cluster006.hosting.ovh.net')) {
      return {
        host: ftpHostDomain,
        user: process.env.FTP_USER_CLUSTER006 || 'nuxidev-crm',
        password: process.env.FTP_PASSWORD_CLUSTER006 || 'Nuxisoft351',
        basePath: process.env.FTP_PATH_CLUSTER006 || '/homez.635/nuxidev/www/NuxiDev/'
      };
    } else if (ftpHostDomain.includes('cluster011.hosting.ovh.net')) {
      return {
        host: ftpHostDomain,
        user: process.env.FTP_USER_CLUSTER011 || 'nuxidevfgj-crm',
        password: process.env.FTP_PASSWORD_CLUSTER011 || 'Nuxisoft351',
        basePath: process.env.FTP_PATH_CLUSTER011 || '/home/nuxidevfgj/www/NuxiDev/'
      };
    } else if (ftpHostDomain.includes('cluster030.hosting.ovh.net')) {
      return {
        host: ftpHostDomain,
        user: process.env.FTP_USER_CLUSTER030 || 'nuxidet-CRM',
        password: process.env.FTP_PASSWORD_CLUSTER030 || 'Nuxisoft351',
        basePath: process.env.FTP_PATH_CLUSTER030 || '/home/nuxidet/www/NuxiDev/'
      };
    }
    
    return null;
  }

  /**
   * Génère le contenu du fichier .htaccess en fonction du serveur FTP
   */
  private generateHtaccessContent(basePath: string, idSynchro: string): string {
    return `AuthUserFile ${basePath}${idSynchro}/.htmdp
AuthGroupFile /dev/null
AuthName "Accès Restreint"
AuthType Basic
require valid-user`;
  }

  /**
   * Génère le contenu du fichier .htmdp
   */
  private generateHtmdpContent(idSynchro: string, secu2Srv1: string): string {
    return `${idSynchro}:${secu2Srv1}`;
  }

  /**
   * Télécharge les fichiers .htaccess et .htmdp sur le serveur FTP
   */
  async uploadSecurityFiles(ftpHost: string, idSynchro: string, secu2Srv1: string): Promise<boolean> {
    if (!ftpHost || !idSynchro || !secu2Srv1) {
      log(`Informations manquantes pour l'upload FTP: host=${ftpHost}, idSynchro=${idSynchro}, secu2Srv1=${secu2Srv1}`, 'ftpService');
      return false;
    }

    // Obtenir les informations FTP du serveur
    const serverInfo = this.getFtpServerInfo(ftpHost);
    if (!serverInfo) {
      log(`Serveur FTP non reconnu: ${ftpHost}`, 'ftpService');
      return false;
    }

    // Créer un dossier temporaire pour les fichiers
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuxidev-ftp-'));
    
    try {
      // Générer les fichiers
      const htaccessContent = this.generateHtaccessContent(serverInfo.basePath, idSynchro);
      const htmdpContent = this.generateHtmdpContent(idSynchro, secu2Srv1);
      
      // Écrire les fichiers temporaires
      const htaccessPath = path.join(tempDir, '.htaccess');
      const htmdpPath = path.join(tempDir, '.htmdp');
      
      fs.writeFileSync(htaccessPath, htaccessContent);
      fs.writeFileSync(htmdpPath, htmdpContent);
      
      // Se connecter au serveur FTP et télécharger les fichiers
      const client = new ftp.Client();
      client.ftp.verbose = true;
      
      try {
        await client.access({
          host: serverInfo.host,
          user: serverInfo.user,
          password: serverInfo.password,
          secure: false
        });
        
        log(`Connecté au serveur FTP: ${serverInfo.host}`, 'ftpService');
        
        // S'assurer que le répertoire de destination existe
        const targetDir = `${idSynchro}`;
        
        try {
          // ensureDir va créer le répertoire s'il n'existe pas
          await client.ensureDir(targetDir);
        } catch (error) {
          log(`Le répertoire ${targetDir} n'existe pas, erreur: ${error instanceof Error ? error.message : String(error)}`, 'ftpService');
          return false;
        }
        
        // Télécharger les fichiers
        await client.uploadFrom(htaccessPath, '.htaccess');
        await client.uploadFrom(htmdpPath, '.htmdp');
        
        log(`Fichiers .htaccess et .htmdp téléchargés avec succès pour ${idSynchro}`, 'ftpService');
        return true;
      } catch (error) {
        log(`Erreur lors de l'upload FTP: ${error instanceof Error ? error.message : String(error)}`, 'ftpService');
        return false;
      } finally {
        client.close();
      }
    } catch (error) {
      log(`Erreur lors de la génération des fichiers: ${error instanceof Error ? error.message : String(error)}`, 'ftpService');
      return false;
    } finally {
      // Nettoyer les fichiers temporaires
      try {
        fs.unlinkSync(path.join(tempDir, '.htaccess'));
        fs.unlinkSync(path.join(tempDir, '.htmdp'));
        fs.rmdirSync(tempDir);
      } catch (error) {
        log(`Erreur lors du nettoyage des fichiers temporaires: ${error instanceof Error ? error.message : String(error)}`, 'ftpService');
      }
    }
  }
}

export const ftpService = new FtpService();