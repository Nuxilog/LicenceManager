import { pgTable, text, serial, integer, boolean, datetime, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// NuxiDev License model - matches the MySQL database structure
export const nuxiDevLicenses = pgTable("nuxi_dev_licenses", {
  ID: serial("id").primaryKey(),
  IDClient: text("id_client"),
  IdentifiantPC: text("identifiant_pc"),
  Options: text("options"),
  Serial: text("serial"),
  Suspendu: integer("suspendu").notNull().default(0),
  NomSoft: text("nom_soft"),
  NomPoste: text("nom_poste"),
  NomSession: text("nom_session"),
  Date_DerUtilisation: datetime("date_der_utilisation"),
  Version: text("version"),
  Data1: text("data1"),
  Data2: text("data2"),
  FTP1_Hote: text("ftp1_hote"),
  FTP2_Hote: text("ftp2_hote"),
  FTP1_Identifiant: text("ftp1_identifiant"),
  FTP2_Identifiant: text("ftp2_identifiant"),
  FTP1_Mdp: text("ftp1_mdp"),
  FTP2_Mdp: text("ftp2_mdp"),
  Data_Actif: integer("data_actif"),
  FTP_Actif: integer("ftp_actif"),
  URL1: text("url1"),
  URL2: text("url2"),
  IDSynchro: text("id_synchro"),
  NbRun: integer("nb_run"),
  Date_LimiteUtil: date("date_limite_util"),
  Terminaux: text("terminaux"),
  Tablettes: text("tablettes"),
  MrqBlancheNum: integer("mrq_blanche_num"),
  Upload1: text("upload1"),
  Upload2: text("upload2"),
  Secu2Srv1: text("secu2srv1"),
  Info: text("info"),
  ConfigConnecteur: text("config_connecteur"),
  Premium: integer("premium").notNull().default(0),
  MDP_Premium: text("mdp_premium"),
  Autorisations_Premium: text("autorisations_premium"),
  ConfigMobile: text("config_mobile"),
  DateClient: date("date_client"),
  Partenaire: integer("partenaire"),
});

export const insertNuxiDevLicenseSchema = createInsertSchema(nuxiDevLicenses).omit({
  ID: true,
});

export type InsertNuxiDevLicense = z.infer<typeof insertNuxiDevLicenseSchema>;
export type NuxiDevLicense = typeof nuxiDevLicenses.$inferSelect;
