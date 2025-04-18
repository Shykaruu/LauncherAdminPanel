import type { Express, Response, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupApiRoutes } from "./api";
import rateLimit from 'express-rate-limit';
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { insertServerSchema, insertModSchema, insertFileSchema, insertServerStatSchema, insertApiConfigSchema, insertInstallerSettingsSchema, insertSiteSettingsSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import fs from "fs-extra";
import path from "path";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up distribution.json API endpoint
  setupApiRoutes(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time stats
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/stats/ws' // Specify a dedicated path for stats WebSocket
  });
  
  wss.on("connection", (ws) => {
    console.log("Stats WebSocket client connected");
    
    try {
      // Send current stats immediately upon connection
      sendCurrentStats(ws);
      
      // Set up interval to send stats periodically
      const statsInterval = setInterval(() => {
        try {
          if (ws.readyState === ws.OPEN) {
            sendCurrentStats(ws);
          } else {
            clearInterval(statsInterval);
          }
        } catch (error) {
          console.error("Error sending periodic stats:", error);
          clearInterval(statsInterval);
        }
      }, 5000);
      
      ws.on("close", () => {
        clearInterval(statsInterval);
        console.log("Stats WebSocket client disconnected");
      });
      
      ws.on("error", (error) => {
        console.error("Stats WebSocket error:", error);
        clearInterval(statsInterval);
      });
    } catch (error) {
      console.error("Error in WebSocket connection handler:", error);
    }
  });
  
  // Check installation status
  app.get("/api/installer/status", async (req, res) => {
    try {
      const isInstalled = await storage.isInstalled();
      res.json({ installed: isInstalled });
    } catch (error) {
      console.error("Error checking installation status:", error);
      res.status(500).json({ message: "Failed to check installation status" });
    }
  });
  
  // Complete installation
  app.post("/api/installer/complete", async (req, res) => {
    try {
      const installerData = insertInstallerSettingsSchema.parse(req.body);
      
      const settings = await storage.updateInstallerSettings({
        ...installerData,
        isInstalled: true
      });
      
      res.status(201).json(settings);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Server routes
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.get("/api/servers/:id", async (req, res) => {
    try {
      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.post("/api/servers", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const serverData = insertServerSchema.parse(req.body);
      const server = await storage.createServer(serverData);
      res.status(201).json(server);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.patch("/api/servers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const serverData = insertServerSchema.partial().parse(req.body);
      const server = await storage.updateServer(req.params.id, serverData);
      
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      res.json(server);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.delete("/api/servers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      await storage.deleteServer(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Mods routes
  app.get("/api/servers/:serverId/mods", async (req, res) => {
    try {
      const mods = await storage.getMods(req.params.serverId);
      res.json(mods);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.post("/api/mods", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const modData = insertModSchema.parse(req.body);
      const mod = await storage.createMod(modData);
      res.status(201).json(mod);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.patch("/api/mods/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const modData = insertModSchema.partial().parse(req.body);
      const mod = await storage.updateMod(Number(req.params.id), modData);
      
      if (!mod) {
        return res.status(404).json({ message: "Mod not found" });
      }
      
      res.json(mod);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.delete("/api/mods/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      await storage.deleteMod(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Files routes
  app.get("/api/servers/:serverId/files", async (req, res) => {
    try {
      const path = req.query.path as string | undefined;
      const files = await storage.getFiles(req.params.serverId, path);
      res.json(files);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.post("/api/files", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.patch("/api/files/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const fileData = insertFileSchema.partial().parse(req.body);
      const file = await storage.updateFile(Number(req.params.id), fileData);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.delete("/api/files/:serverId/delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const { path: filePath, isDirectory } = req.body;
      if (!filePath) {
        return res.status(400).json({ message: "Path is required" });
      }

      const fullPath = path.join(process.cwd(), 'client', 'public', 'uploads', req.params.serverId, filePath);
      
      if (isDirectory) {
        await fs.remove(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
      
      // Delete from database
      const files = await storage.getFiles(req.params.serverId, filePath);
      for (const file of files) {
        await storage.deleteFile(file.id);
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/files/:serverId/content", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const filePath = path.join(process.cwd(), 'client', 'public', 'uploads', req.params.serverId, req.query.path as string);
      const content = await fs.readFile(filePath, 'utf8');
      res.send(content);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Server stats routes
  app.get("/api/servers/:serverId/stats", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const stats = await storage.getServerStats(req.params.serverId, limit);
      res.json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Active Stats API endpoint - allows external services to report real-time statistics
  // Rate limit: 60 requests per minute
  const statsRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: "Too many requests, please try again later" }
  });

  /**
   * POST /api/stats
   * Report server statistics
   * @param {string} serverId - The server ID
   * @param {number} activePlayers - Number of active players
   * @param {number} currentBandwidth - Current bandwidth usage in bytes/sec
   * @param {number} totalBandwidth - Total bandwidth used in bytes
   * @param {number} totalSessionTime - Total session time in seconds
   */
  app.post("/api/stats", statsRateLimit, async (req, res) => {
    try {
      const statData = insertServerStatSchema.parse(req.body);
      
      // Verify the server exists
      const server = await storage.getServer(statData.serverId);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      const stat = await storage.createServerStat(statData);
      res.status(201).json(stat);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // API config routes
  app.get("/api/config", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const config = await storage.getApiConfig();
      res.json(config || {});
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.post("/api/config", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const configData = insertApiConfigSchema.parse(req.body);
      const config = await storage.updateApiConfig(configData);
      res.json(config);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Site settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const settings = await storage.getSiteSettings();
      res.json(settings || {});
    } catch (error) {
      handleError(error, res);
    }
  });
  
  app.post("/api/settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const settingsData = insertSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(settingsData);
      res.json(settings);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const { serverId, path: filePath } = req.params;
        const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads', serverId, filePath || '');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      }
    })
  });
  
  // File upload endpoint
  app.post("/api/files/:serverId/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const serverId = req.params.serverId;
      const uploadPath = req.query.path as string || '';
      const fullPath = uploadPath ? `${uploadPath}/${req.file.originalname}` : req.file.originalname;

      // Vérifier si un fichier avec le même nom existe déjà
      const existingFiles = await storage.getFiles(serverId, uploadPath);
      const fileExists = existingFiles.some(f => 
        f.path.split('/').pop() === req.file?.originalname
      );

      if (fileExists) {
        return res.status(400).json({ message: "A file with this name already exists in this directory" });
      }
      
      const file = await storage.createFile({
        serverId: serverId,
        path: fullPath,
        isDirectory: false,
        size: req.file.size
      });
      
      res.json(file);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Create directory endpoint
  app.post("/api/files/:serverId/mkdir", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      const { serverId } = req.params;
      const { path: dirPath } = req.body;
      
      // Create the directory on disk
      const dirFullPath = path.join(process.cwd(), 'client', 'public', 'uploads', serverId, dirPath);
      await fs.ensureDir(dirFullPath);
      
      const file = await storage.createFile({
        serverId: serverId,
        path: dirPath,
        isDirectory: true,
        size: 0
      });
      
      res.json(file);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Logo upload route
  app.post("/api/settings/logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get the relative path to the uploaded file for use in the frontend
      const logoPath = `/uploads/${path.basename(req.file.path)}`;
      
      // Save the logo URL to the site settings
      const settings = await storage.updateLogo(logoPath);
      
      res.json({
        success: true,
        logoUrl: logoPath,
        settings
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Error uploading logo" });
    }
  });
  
  return httpServer;
}

// Function to send current stats via WebSocket
async function sendCurrentStats(ws: any) {
  try {
    const servers = await storage.getServers();
    
    const statsPromises = servers.map(async (server) => {
      const stats = await storage.getServerStats(server.serverId, 1);
      return {
        serverId: server.serverId,
        serverName: server.name,
        stats: stats[0] || {
          activePlayers: 0,
          currentBandwidth: 0,
          totalBandwidth: 0,
          totalSessionTime: 0
        }
      };
    });
    
    const allStats = await Promise.all(statsPromises);
    
    ws.send(JSON.stringify({
      type: 'stats',
      data: allStats
    }));
  } catch (error) {
    console.error("Error sending stats via WebSocket:", error);
  }
}

// Error handling function
function handleError(error: any, res: Response) {
  console.error("API Error:", error);
  
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    return res.status(400).json({ message: validationError.message });
  }
  
  res.status(500).json({ message: "Internal server error" });
}
