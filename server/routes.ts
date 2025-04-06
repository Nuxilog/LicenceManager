import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { nuxiDevLicenseService } from "./services/licenseService";

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
        sortDirection = "desc" 
      } = req.query as Record<string, string>;
      
      const filters = {
        idClient,
        idSynchro,
        serial,
        identifiantPC,
        onlyNuxiDev: onlyNuxiDev === "true"
      };
      
      const licenses = await nuxiDevLicenseService.getLicenses(
        filters, 
        { key: sortBy, direction: sortDirection as "asc" | "desc" }
      );
      
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to fetch licenses" });
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
