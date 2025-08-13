import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  birthDate: text("birth_date"),
  deathDate: text("death_date"),
  birthPlace: text("birth_place"),
  deathPlace: text("death_place"),
  notes: text("notes"),
  photos: jsonb("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  locationType: text("location_type"), // birth, death, residence, etc.
  timeSpan: text("time_span"),
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => familyMembers.id),
  locationId: varchar("location_id").references(() => locations.id),
  eventType: text("event_type").notNull(), // birth, death, marriage, migration, etc.
  eventDate: text("event_date"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  locationId: varchar("location_id").references(() => locations.id),
  memberIds: jsonb("member_ids").$type<string[]>().default([]),
  eventIds: jsonb("event_ids").$type<string[]>().default([]),
  isGenerated: boolean("is_generated").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const geopackageLayers = pgTable("geopackage_layers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  layerName: text("layer_name").notNull(),
  layerType: text("layer_type").notNull(), // vector, raster
  isVisible: boolean("is_visible").default(true),
  style: jsonb("style").$type<Record<string, any>>(),
  bounds: jsonb("bounds").$type<[number, number, number, number]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const atlasProjects = pgTable("atlas_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  memberCount: integer("member_count").default(0),
  locationCount: integer("location_count").default(0),
  storyCount: integer("story_count").default(0),
  timeSpan: text("time_span"),
  lastGenerated: timestamp("last_generated"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export const insertGeopackageLayerSchema = createInsertSchema(geopackageLayers).omit({
  id: true,
  createdAt: true,
});

export const insertAtlasProjectSchema = createInsertSchema(atlasProjects).omit({
  id: true,
  createdAt: true,
  lastGenerated: true,
});

// Types
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type GeopackageLayer = typeof geopackageLayers.$inferSelect;
export type InsertGeopackageLayer = z.infer<typeof insertGeopackageLayerSchema>;

export type AtlasProject = typeof atlasProjects.$inferSelect;
export type InsertAtlasProject = z.infer<typeof insertAtlasProjectSchema>;
