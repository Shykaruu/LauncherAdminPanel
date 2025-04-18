import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Roles enum
export const roleEnum = pgEnum('role', ['admin', 'moderator', 'user']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('user'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions),
}));

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// User Permissions join table
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
});

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Server Instances table
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  version: text("version").notNull(),
  address: text("address"),
  minecraftVersion: text("minecraft_version").notNull(),
  loaderType: text("loader_type").notNull(), // "Fabric" or "Forge"
  loaderVersion: text("loader_version").notNull(),
  mainServer: boolean("main_server").default(false),
  autoconnect: boolean("autoconnect").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serversRelations = relations(servers, ({ many }) => ({
  mods: many(mods),
  stats: many(serverStats),
}));

// Mods table
export const mods = pgTable("mods", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.serverId, { onDelete: 'cascade' }),
  modId: text("mod_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  version: text("version"),
  required: boolean("required").default(true),
  enabled: boolean("enabled").default(true),
  optionalDefault: boolean("optional_default").default(false), // true for optional-on, false for optional-off
  size: integer("size"),
  url: text("url").notNull(),
  md5: text("md5"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const modsRelations = relations(mods, ({ one }) => ({
  server: one(servers, {
    fields: [mods.serverId],
    references: [servers.serverId],
  }),
}));

// Server Stats table
export const serverStats = pgTable("server_stats", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.serverId, { onDelete: 'cascade' }),
  activePlayers: integer("active_players").default(0),
  currentBandwidth: integer("current_bandwidth").default(0), // in bytes/sec
  totalBandwidth: integer("total_bandwidth").default(0), // in bytes
  totalSessionTime: integer("total_session_time").default(0), // in seconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const serverStatsRelations = relations(serverStats, ({ one }) => ({
  server: one(servers, {
    fields: [serverStats.serverId],
    references: [servers.serverId],
  }),
}));

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.serverId, { onDelete: 'cascade' }),
  path: text("path").notNull(),
  isDirectory: boolean("is_directory").default(false),
  isSticky: boolean("is_sticky").default(false),
  size: integer("size"),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

export const filesRelations = relations(files, ({ one }) => ({
  server: one(servers, {
    fields: [files.serverId],
    references: [servers.serverId],
  }),
}));

// Installer Settings
export const installerSettings = pgTable("installer_settings", {
  id: serial("id").primaryKey(),
  isInstalled: boolean("is_installed").default(false),
  dbHost: text("db_host"),
  dbPort: text("db_port"),
  dbName: text("db_name"),
  dbUser: text("db_user"),
  installedAt: timestamp("installed_at"),
});

// API Configuration
export const apiConfig = pgTable("api_config", {
  id: serial("id").primaryKey(),
  rssUrl: text("rss_url"),
  discordClientId: text("discord_client_id"),
  discordSmallImageText: text("discord_small_image_text"),
  discordSmallImageKey: text("discord_small_image_key"),
  version: text("version").default("1.0.0"),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("MineLaunch Admin Panel"),
  siteUrl: text("site_url").default("https://admin.minelauncher.com"),
  logoUrl: text("logo_url"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  enableRegistration: boolean("enable_registration").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema Types
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertServerSchema = createInsertSchema(servers)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertModSchema = createInsertSchema(mods)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertFileSchema = createInsertSchema(files)
  .omit({ id: true, lastModified: true });

export const insertServerStatSchema = createInsertSchema(serverStats)
  .omit({ id: true, timestamp: true });

export const insertInstallerSettingsSchema = createInsertSchema(installerSettings)
  .omit({ id: true, installedAt: true });

export const insertApiConfigSchema = createInsertSchema(apiConfig)
  .omit({ id: true });

export const insertSiteSettingsSchema = createInsertSchema(siteSettings)
  .omit({ id: true, updatedAt: true });

export const insertPermissionSchema = createInsertSchema(permissions)
  .omit({ id: true });

export const insertUserPermissionSchema = createInsertSchema(userPermissions)
  .omit({ id: true });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type InsertMod = z.infer<typeof insertModSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertServerStat = z.infer<typeof insertServerStatSchema>;
export type InsertInstallerSettings = z.infer<typeof insertInstallerSettingsSchema>;
export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

// Select types
export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type Mod = typeof mods.$inferSelect;
export type File = typeof files.$inferSelect;
export type ServerStat = typeof serverStats.$inferSelect;
export type InstallerSetting = typeof installerSettings.$inferSelect;
export type ApiConfig = typeof apiConfig.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;

// Extension schemas for additional validation
export const loginUserSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export type LoginUser = z.infer<typeof loginUserSchema>;
