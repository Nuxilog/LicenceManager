import type { Express } from "express";
import { createServer, type Server } from "http";
// Pas besoin d'importer db car il n'est pas utilisé
import { nuxiDevLicenseService } from "./services/licenseService";
import { cryptService } from "./services/cryptService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Licenses API routes
  app.get("/api/licenses", async (req, res) => {
    try {
      const { 
        idClient, 
        idSynchro, 
        serial, 
        identifiantPC, 
        onlyNuxiDev,
        sortBy = "ID",
        sortDirection = "desc",
        page = "1",
        pageSize = "10"
      } = req.query as Record<string, string>;
      
      const filters = {
        idClient,
        idSynchro,
        serial,
        identifiantPC,
        onlyNuxiDev: onlyNuxiDev === "true"
      };
      
      const pageNum = parseInt(page, 10) || 1;
      const pageSizeNum = parseInt(pageSize, 10) || 10;
      
      const licenses = await nuxiDevLicenseService.getLicenses(
        filters, 
        { key: sortBy, direction: sortDirection as "asc" | "desc" },
        pageNum,
        pageSizeNum
      );
      
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch licenses" });
    }
  });

  // Endpoint pour crypter un mot de passe avec l'algorithme crypt() de PHP
  app.post("/api/crypt", (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      const cryptedPassword = cryptService.crypt(password);
      
      res.json({ password, crypted: cryptedPassword });
    } catch (error) {
      console.error("Error crypting password:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to crypt password" });
    }
  });

  // Endpoint pour vérifier si un ID de Synchro existe déjà
  app.get("/api/licenses/check-id-synchro/:idSynchro", async (req, res) => {
    try {
      const { idSynchro } = req.params;
      const { excludeLicenseId } = req.query;
      
      const excludeId = excludeLicenseId ? parseInt(excludeLicenseId as string) : undefined;
      
      const existingLicenses = await nuxiDevLicenseService.checkIfIDSynchroExists(idSynchro, excludeId);
      
      res.json({
        exists: existingLicenses.length > 0,
        licenses: existingLicenses
      });
    } catch (error) {
      console.error("Error checking ID Synchro uniqueness:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to check ID Synchro uniqueness" });
    }
  });

  app.get("/api/licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }
      
      const license = await nuxiDevLicenseService.getLicenseById(id);
      
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      res.json(license);
    } catch (error) {
      console.error("Error fetching license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch license" });
    }
  });

  app.post("/api/licenses", async (req, res) => {
    try {
      const licenseData = req.body;
      
      // Validate required fields
      if (!licenseData.Serial) {
        return res.status(400).json({ message: "Serial is required" });
      }
      
      const newLicense = await nuxiDevLicenseService.createLicense(licenseData);
      
      res.status(201).json(newLicense);
    } catch (error) {
      console.error("Error creating license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to create license" });
    }
  });

  app.put("/api/licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }
      
      const licenseData = req.body;
      
      // Check if license exists
      const existingLicense = await nuxiDevLicenseService.getLicenseById(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "License not found" });
      }
      
      const updatedLicense = await nuxiDevLicenseService.updateLicense(id, licenseData);
      
      res.json(updatedLicense);
    } catch (error) {
      console.error("Error updating license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to update license" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
