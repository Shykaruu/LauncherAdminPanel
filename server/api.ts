import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { Server, Mod } from "@shared/schema";

export function setupApiRoutes(app: Express) {
  // Distribution.json endpoint
  app.get("/api/distribution", async (req, res) => {
    try {
      // Get API configuration
      const apiConfig = await storage.getApiConfig();
      if (!apiConfig) {
        return res.status(500).json({ error: "API configuration not found" });
      }
      
      // Get all server instances
      const serverInstances = await storage.getServers();
      
      // Transform to distribution.json format
      const distribution = {
        version: apiConfig.version || "1.0.0",
        rss: apiConfig.rssUrl || "",
        discord: {
          clientId: apiConfig.discordClientId || "",
          smallImageText: apiConfig.discordSmallImageText || "logo",
          smallImageKey: apiConfig.discordSmallImageKey || "logo"
        },
        servers: await Promise.all(serverInstances.map(async (server) => {
          // Get mods for this server
          const serverMods = await storage.getMods(server.serverId);
          
          // Transform mods into expected format
          const modules = await transformModsToModules(serverMods, server);
          
          return {
            id: server.serverId,
            name: server.name,
            description: server.description || "",
            icon: server.icon || "",
            version: server.version,
            address: server.address || "",
            minecraftVersion: server.minecraftVersion,
            discord: {
              shortId: apiConfig.discordClientId || "",
              largeImageText: "logo",
              largeImageKey: "logo_without_background"
            },
            mainServer: server.mainServer,
            autoconnect: server.autoconnect,
            modules
          };
        }))
      };
      
      res.json(distribution);
    } catch (error) {
      console.error("Error generating distribution.json:", error);
      res.status(500).json({ error: "Failed to generate distribution.json" });
    }
  });
}

// Helper function to transform mods to modules format
async function transformModsToModules(mods: Mod[], server: Server): Promise<any[]> {
  const modules = [];

  // Transform regular mods
  mods.forEach(mod => {
    const baseModule = {
      id: mod.modId,
      name: mod.name,
      type: mod.type === 'Library' ? 'Library' : 'FabricMod',
      artifact: {
        size: mod.size || 0,
        url: `/uploads/${server.serverId}/mods/${mod.modId}`,
        MD5: mod.md5 || ""
      }
    };
    
    if (!mod.required) {
      baseModule['required'] = { value: false };
    }
    
    modules.push(baseModule);
  });

  // Add uploaded files
  const files = await storage.getFiles(server.serverId);
  files.forEach(file => {
    if (!file.isDirectory) {
      modules.push({
        id: path.basename(file.path),
        name: path.basename(file.path),
        type: "File",
        artifact: {
          size: file.size || 0,
          url: `/uploads/${server.serverId}/${file.path}`,
          path: file.path
        }
      });
    }
  });

  return modules;
}
