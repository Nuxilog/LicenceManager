import type { Express } from "express";
import { createServer, type Server } from "http";
// Pas besoin d'importer db car il n'est pas utilisé
import { nuxiDevLicenseService, studioLicenseService } from "./services/licenseService";
import { apiKeyService } from "./services/apiKeyService";

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

  // Licences Studio API routes
  app.get("/api/studio-licenses", async (req, res) => {
    try {
      const { 
        numClient, 
        serial, 
        identifiantUser, 
        onlyWithPDF,
        onlyWithVue,
        onlyWithPagePerso,
        onlyWithWDE,
        hideSuspended,
        sortBy = "ID",
        sortDirection = "desc",
        page = "1",
        pageSize = "10"
      } = req.query as Record<string, string>;
      
      const filters = {
        numClient,
        serial,
        identifiantUser,
        onlyWithPDF: onlyWithPDF === "true",
        onlyWithVue: onlyWithVue === "true",
        onlyWithPagePerso: onlyWithPagePerso === "true",
        onlyWithWDE: onlyWithWDE === "true",
        hideSuspended: hideSuspended === "true"
      };
      
      const pageNum = parseInt(page, 10) || 1;
      const pageSizeNum = parseInt(pageSize, 10) || 10;
      
      const licenses = await studioLicenseService.getLicenses(
        filters, 
        { key: sortBy, direction: sortDirection as "asc" | "desc" },
        pageNum,
        pageSizeNum
      );
      
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching studio licenses:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch studio licenses" });
    }
  });

  app.get("/api/studio-licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid studio license ID" });
      }
      
      const license = await studioLicenseService.getLicenseById(id);
      
      if (!license) {
        return res.status(404).json({ message: "Studio license not found" });
      }
      
      res.json(license);
    } catch (error) {
      console.error("Error fetching studio license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch studio license" });
    }
  });

  app.post("/api/studio-licenses", async (req, res) => {
    try {
      const licenseData = req.body;
      
      // Validate required fields
      if (!licenseData.NumClient) {
        return res.status(400).json({ message: "NumClient is required" });
      }
      
      const newLicense = await studioLicenseService.createLicense(licenseData);
      
      res.status(201).json(newLicense);
    } catch (error) {
      console.error("Error creating studio license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to create studio license" });
    }
  });

  app.put("/api/studio-licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid studio license ID" });
      }
      
      const licenseData = req.body;
      
      // Check if license exists
      const existingLicense = await studioLicenseService.getLicenseById(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "Studio license not found" });
      }
      
      const updatedLicense = await studioLicenseService.updateLicense(id, licenseData);
      
      res.json(updatedLicense);
    } catch (error) {
      console.error("Error updating studio license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to update studio license" });
    }
  });

  // API Key licenses routes
  app.get("/api/apikey-licenses", async (req, res) => {
    try {
      const { 
        clientId, 
        apiKey, 
        showExpired,
        showInactive,
        sortBy = "ID",
        sortDirection = "desc",
        page = "1",
        pageSize = "15"
      } = req.query as Record<string, string>;
      
      const filters = {
        clientId,
        apiKey,
        showExpired: showExpired === "true",
        showInactive: showInactive === "true"
      };
      
      const pageNum = parseInt(page, 10) || 1;
      const pageSizeNum = parseInt(pageSize, 10) || 15;

      // Avant d'appeler le service, explorons la structure de la table
      try {
        await apiKeyService.exploreTableStructure();
      } catch (error) {
        console.warn("Couldn't explore API table structure:", error);
      }
      
      const licenses = await apiKeyService.getLicenses(
        filters, 
        { key: sortBy, direction: sortDirection as "asc" | "desc" },
        pageNum,
        pageSizeNum
      );
      
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching API key licenses:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch API key licenses" });
    }
  });

  app.get("/api/apikey-licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid API key license ID" });
      }
      
      const license = await apiKeyService.getLicenseById(id);
      
      if (!license) {
        return res.status(404).json({ message: "API key license not found" });
      }
      
      res.json(license);
    } catch (error) {
      console.error("Error fetching API key license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch API key license" });
    }
  });

  app.post("/api/apikey-licenses", async (req, res) => {
    try {
      const licenseData = req.body;
      
      // Validate required fields
      if (!licenseData.ClientID) {
        return res.status(400).json({ message: "ClientID is required" });
      }
      if (!licenseData.ApiKey) {
        return res.status(400).json({ message: "ApiKey is required" });
      }
      
      const newLicense = await apiKeyService.createLicense(licenseData);
      
      res.status(201).json(newLicense);
    } catch (error) {
      console.error("Error creating API key license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to create API key license" });
    }
  });

  app.put("/api/apikey-licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid API key license ID" });
      }
      
      const licenseData = req.body;
      
      // Check if license exists
      const existingLicense = await apiKeyService.getLicenseById(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "API key license not found" });
      }
      
      const updatedLicense = await apiKeyService.updateLicense(id, licenseData);
      
      res.json(updatedLicense);
    } catch (error) {
      console.error("Error updating API key license:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to update API key license" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
