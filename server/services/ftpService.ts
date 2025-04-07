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
      
      // Écrire les fichiers temporaires sans encodage UTF-8
      const htaccessPath = path.join(tempDir, '.htaccess');
      const htmdpPath = path.join(tempDir, '.htmdp');
      
      fs.writeFileSync(htaccessPath, htaccessContent, { encoding: 'latin1' });
      fs.writeFileSync(htmdpPath, htmdpContent, { encoding: 'latin1' });
      
      // Vérifier le contenu du fichier .htaccess pour s'assurer que l'encodage est correct
      const contentCheck = fs.readFileSync(htaccessPath, { encoding: 'latin1' });
      log(`Contenu du fichier .htaccess (vérification encodage): ${contentCheck}`, 'ftpService');
      
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
        
        // Désactiver explicitement l'encodage UTF-8
        try {
          await client.send("OPTS UTF8 OFF");
        } catch (error) {
          // Certains serveurs peuvent ne pas supporter cette commande, donc on ignore l'erreur
          log("Impossible de désactiver UTF-8, mais on continue", 'ftpService');
        }
        
        log(`Connecté au serveur FTP: ${serverInfo.host}`, 'ftpService');
        
        // Se déplacer dans le répertoire NuxiDev si nécessaire (selon le chemin de base)
        const rootDir = '/';
        const nuxiDevDir = 'NuxiDev';
        
        try {
          // D'abord, s'assurer que nous sommes à la racine
          await client.cd(rootDir);
          
          // Vérifier si le répertoire NuxiDev existe, sinon le créer
          try {
            await client.cd(nuxiDevDir);
          } catch (error) {
            try {
              await client.send(`MKD ${nuxiDevDir}`);
              await client.cd(nuxiDevDir);
            } catch (dirError) {
              log(`Impossible de créer le répertoire ${nuxiDevDir}: ${dirError instanceof Error ? dirError.message : String(dirError)}`, 'ftpService');
              return false;
            }
          }
          
          // Maintenant, vérifier si le répertoire de l'ID Synchro existe, sinon le créer
          try {
            await client.cd(idSynchro);
          } catch (error) {
            try {
              await client.send(`MKD ${idSynchro}`);
              await client.cd(idSynchro);
            } catch (dirError) {
              log(`Impossible de créer le répertoire ${nuxiDevDir}/${idSynchro}: ${dirError instanceof Error ? dirError.message : String(dirError)}`, 'ftpService');
              return false;
            }
          }
          
          // Nous sommes maintenant dans /NuxiDev/IDSynchro/
          
          // Télécharger les fichiers en mode binaire
          // Définir le type de transfert en binaire
          await client.send('TYPE I');
          await client.uploadFrom(htaccessPath, '.htaccess');
          await client.uploadFrom(htmdpPath, '.htmdp');
          
          log(`Fichiers .htaccess et .htmdp téléchargés avec succès dans ${nuxiDevDir}/${idSynchro}/`, 'ftpService');
        } catch (error) {
          log(`Erreur lors de la navigation dans les répertoires: ${error instanceof Error ? error.message : String(error)}`, 'ftpService');
          return false;
        }
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