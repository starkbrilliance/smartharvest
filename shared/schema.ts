import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const growAreas = pgTable("grow_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subareas = pgTable("subareas", {
  id: uuid("id").defaultRandom().primaryKey(),
  growAreaId: uuid("grow_area_id").notNull().references(() => growAreas.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const crops = pgTable("crops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  variety: text("variety"),
  // location: text("location").notNull(), // DEPRECATED: replaced by subareaId
  subareaId: uuid("subarea_id").references(() => subareas.id),
  plantedDate: timestamp("planted_date").notNull(),
  expectedHarvestDate: timestamp("expected_harvest_date").notNull(),
  actualHarvestDate: timestamp("actual_harvest_date"),
  status: text("status").notNull().default("growing"), // growing, flowering, ready, harvested
  notes: text("notes"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  cropId: uuid("crop_id").notNull().references(() => crops.id),
  type: text("type").notNull(), // watering, fertilizing, pruning, inspection, treatment, harvest, other
  notes: text("notes"),
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  isAuthenticated: boolean("is_authenticated").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const growAreasRelations = relations(growAreas, ({ many }) => ({
  subareas: many(subareas),
}));

export const subareasRelations = relations(subareas, ({ one, many }) => ({
  growArea: one(growAreas, {
    fields: [subareas.growAreaId],
    references: [growAreas.id],
  }),
  crops: many(crops),
}));

export const cropsRelations = relations(crops, ({ many, one }) => ({
  events: many(events),
  subarea: one(subareas, {
    fields: [crops.subareaId],
    references: [subareas.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  crop: one(crops, {
    fields: [events.cropId],
    references: [crops.id],
  }),
}));

// Base schema from drizzle
const baseCropSchema = createInsertSchema(crops).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

// Extended schema with string date handling
export const insertCropSchema = baseCropSchema.extend({
  plantedDate: z.string().transform((str) => new Date(str)),
  expectedHarvestDate: z.string().transform((str) => new Date(str)),
  actualHarvestDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  subareaId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
});

const baseEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = baseEventSchema.extend({
  eventDate: z.string().transform((str) => new Date(str)),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
