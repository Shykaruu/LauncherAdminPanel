import { users, type User, type InsertUser, servers, type Server, type InsertServer, mods, type Mod, type InsertMod, files, type File, type InsertFile, serverStats, type ServerStat, type InsertServerStat, installerSettings, type InstallerSetting, type InsertInstallerSettings, apiConfig, type ApiConfig, type InsertApiConfig, siteSettings, type SiteSettings, type InsertSiteSettings, permissions, type Permission, type InsertPermission, userPermissions, type UserPermission, type InsertUserPermission } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Server operations
  getServers(): Promise<Server[]>;
  getServer(id: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: string, server: Partial<InsertServer>): Promise<Server | undefined>;
  deleteServer(id: string): Promise<boolean>;
  
  // Mod operations
  getMods(serverId: string): Promise<Mod[]>;
  getMod(id: number): Promise<Mod | undefined>;
  createMod(mod: InsertMod): Promise<Mod>;
  updateMod(id: number, mod: Partial<InsertMod>): Promise<Mod | undefined>;
  deleteMod(id: number): Promise<boolean>;
  
  // File operations
  getFiles(serverId: string, path?: string): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // Server stats operations
  getServerStats(serverId: string, limit?: number): Promise<ServerStat[]>;
  createServerStat(stat: InsertServerStat): Promise<ServerStat>;
  
  // Installer operations
  getInstallerSettings(): Promise<InstallerSetting | undefined>;
  updateInstallerSettings(settings: InsertInstallerSettings): Promise<InstallerSetting>;
  isInstalled(): Promise<boolean>;
  
  // API config operations
  getApiConfig(): Promise<ApiConfig | undefined>;
  updateApiConfig(config: InsertApiConfig): Promise<ApiConfig>;
  
  // Site settings operations
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  updateLogo(logoUrl: string): Promise<SiteSettings>;
  
  // Permission operations
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  getUserPermissions(userId: number): Promise<Permission[]>;
  addUserPermission(userPermission: InsertUserPermission): Promise<UserPermission>;
  removeUserPermission(userId: number, permissionId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return true;
  }
  
  // Server operations
  async getServers(): Promise<Server[]> {
    return db.select().from(servers).orderBy(servers.name);
  }
  
  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.serverId, id));
    return server;
  }
  
  async createServer(insertServer: InsertServer): Promise<Server> {
    // Add default required libraries
    const defaultLibraries = [
      {
        id: "net.fabricmc:fabric-loader:0.16.13",
        name: "Fabric",
        type: "Library",
        url: "https://maven.fabricmc.net/net/fabricmc/fabric-loader/0.16.13/fabric-loader-0.16.13.jar"
      },
      {
        id: "net.fabricmc:intermediary:1.20.1",
        name: "Fabric Intermediary",
        type: "Library", 
        url: "https://maven.fabricmc.net/net/fabricmc/intermediary/1.20.1/intermediary-1.20.1.jar"
      }
    ];

    const [server] = await db
      .insert(servers)
      .values({
        ...insertServer,
        updatedAt: new Date()
      })
      .returning();

    // Add default libraries as mods
    for (const lib of defaultLibraries) {
      await this.createMod({
        serverId: server.serverId,
        modId: lib.id,
        name: lib.name,
        type: lib.type,
        url: lib.url,
        required: true
      });
    }

    return server;
  }
  
  async updateServer(id: string, updateServer: Partial<InsertServer>): Promise<Server | undefined> {
    const [server] = await db
      .update(servers)
      .set({
        ...updateServer,
        updatedAt: new Date()
      })
      .where(eq(servers.serverId, id))
      .returning();
    return server;
  }
  
  async deleteServer(id: string): Promise<boolean> {
    await db
      .delete(servers)
      .where(eq(servers.serverId, id));
    return true;
  }
  
  // Mod operations
  async getMods(serverId: string): Promise<Mod[]> {
    return db.select().from(mods).where(eq(mods.serverId, serverId));
  }
  
  async getMod(id: number): Promise<Mod | undefined> {
    const [mod] = await db.select().from(mods).where(eq(mods.id, id));
    return mod;
  }
  
  async createMod(insertMod: InsertMod): Promise<Mod> {
    const [mod] = await db
      .insert(mods)
      .values({
        ...insertMod,
        updatedAt: new Date()
      })
      .returning();
    return mod;
  }
  
  async updateMod(id: number, updateMod: Partial<InsertMod>): Promise<Mod | undefined> {
    const [mod] = await db
      .update(mods)
      .set({
        ...updateMod,
        updatedAt: new Date()
      })
      .where(eq(mods.id, id))
      .returning();
    return mod;
  }
  
  async deleteMod(id: number): Promise<boolean> {
    await db
      .delete(mods)
      .where(eq(mods.id, id));
    return true;
  }
  
  // File operations
  async getFiles(serverId: string, path?: string): Promise<File[]> {
    if (path) {
      return db.select().from(files).where(
        and(
          eq(files.serverId, serverId),
          sql`${files.path} LIKE ${path + '/%'} OR ${files.path} = ${path}`
        )
      );
    }
    return db.select().from(files).where(eq(files.serverId, serverId));
  }
  
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values({
        ...insertFile,
        lastModified: new Date()
      })
      .returning();
    return file;
  }
  
  async updateFile(id: number, updateFile: Partial<InsertFile>): Promise<File | undefined> {
    const [file] = await db
      .update(files)
      .set({
        ...updateFile,
        lastModified: new Date()
      })
      .where(eq(files.id, id))
      .returning();
    return file;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    await db
      .delete(files)
      .where(eq(files.id, id));
    return true;
  }
  
  // Server stats operations
  async getServerStats(serverId: string, limit: number = 24): Promise<ServerStat[]> {
    return db.select()
      .from(serverStats)
      .where(eq(serverStats.serverId, serverId))
      .orderBy(desc(serverStats.timestamp))
      .limit(limit);
  }
  
  async createServerStat(insertStat: InsertServerStat): Promise<ServerStat> {
    const [stat] = await db
      .insert(serverStats)
      .values(insertStat)
      .returning();
    return stat;
  }
  
  // Installer operations
  async getInstallerSettings(): Promise<InstallerSetting | undefined> {
    const [settings] = await db.select().from(installerSettings);
    return settings;
  }
  
  async updateInstallerSettings(updateSettings: InsertInstallerSettings): Promise<InstallerSetting> {
    const [existingSettings] = await db.select().from(installerSettings);
    
    if (existingSettings) {
      const [settings] = await db
        .update(installerSettings)
        .set({
          ...updateSettings,
          installedAt: new Date()
        })
        .where(eq(installerSettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(installerSettings)
        .values({
          ...updateSettings,
          installedAt: new Date()
        })
        .returning();
      return settings;
    }
  }
  
  async isInstalled(): Promise<boolean> {
    const [settings] = await db.select().from(installerSettings);
    return settings?.isInstalled || false;
  }
  
  // API config operations
  async getApiConfig(): Promise<ApiConfig | undefined> {
    const [config] = await db.select().from(apiConfig);
    return config;
  }
  
  async updateApiConfig(updateConfig: InsertApiConfig): Promise<ApiConfig> {
    const [existingConfig] = await db.select().from(apiConfig);
    
    if (existingConfig) {
      const [config] = await db
        .update(apiConfig)
        .set(updateConfig)
        .where(eq(apiConfig.id, existingConfig.id))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(apiConfig)
        .values(updateConfig)
        .returning();
      return config;
    }
  }
  
  // Site settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings);
    return settings;
  }
  
  async updateSiteSettings(updateSettings: InsertSiteSettings): Promise<SiteSettings> {
    const [existingSettings] = await db.select().from(siteSettings);
    
    if (existingSettings) {
      const [settings] = await db
        .update(siteSettings)
        .set({
          ...updateSettings,
          updatedAt: new Date()
        })
        .where(eq(siteSettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(siteSettings)
        .values({
          ...updateSettings,
          updatedAt: new Date()
        })
        .returning();
      return settings;
    }
  }
  
  async updateLogo(logoUrl: string): Promise<SiteSettings> {
    const [existingSettings] = await db.select().from(siteSettings);
    
    if (existingSettings) {
      const [settings] = await db
        .update(siteSettings)
        .set({
          logoUrl,
          updatedAt: new Date()
        })
        .where(eq(siteSettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(siteSettings)
        .values({
          logoUrl,
          updatedAt: new Date()
        })
        .returning();
      return settings;
    }
  }
  
  // Permission operations
  async getPermissions(): Promise<Permission[]> {
    return db.select().from(permissions);
  }
  
  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db
      .insert(permissions)
      .values(insertPermission)
      .returning();
    return permission;
  }
  
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const result = await db
      .select({
        permission: permissions
      })
      .from(permissions)
      .innerJoin(userPermissions, eq(permissions.id, userPermissions.permissionId))
      .where(eq(userPermissions.userId, userId));
    
    return result.map(r => r.permission);
  }
  
  async addUserPermission(insertUserPermission: InsertUserPermission): Promise<UserPermission> {
    const [userPermission] = await db
      .insert(userPermissions)
      .values(insertUserPermission)
      .returning();
    return userPermission;
  }
  
  async removeUserPermission(userId: number, permissionId: number): Promise<boolean> {
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId)
        )
      );
    return true;
  }
}

export const storage = new DatabaseStorage();
