import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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
  areaId: uuid("area_id").references(() => growAreas.id),
  plantedDate: timestamp("planted_date").notNull(),
  expectedHarvestDate: timestamp("expected_harvest_date").notNull(),
  actualHarvestDate: timestamp("actual_harvest_date"),
  status: text("status").notNull().default("growing"), // growing, flowering, ready, harvested
  notes: text("notes"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  maintenanceSchedule: jsonb("maintenance_schedule").notNull().default("[]"),
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().default(sql`nextval('events_id_seq')`),
  cropId: uuid("crop_id").notNull().references(() => crops.id),
  type: text("type").notNull(), // watering, fertilizing, pruning, inspection, treatment, harvest, other
  notes: text("notes"),
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().default(sql`nextval('sessions_id_seq')`),
  sessionToken: text("session_token").notNull().unique(),
  isAuthenticated: boolean("is_authenticated").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: integer("id").primaryKey().default(sql`nextval('maintenance_schedules_id_seq')`),
  cropId: uuid("crop_id").notNull().references(() => crops.id),
  eventType: text("type").notNull(), // watering, fertilizing, pruning, inspection, treatment
  frequency: text("frequency").notNull(), // daily, weekly, every_3_days, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cropTemplates = pgTable("crop_templates", {
  id: integer("id").primaryKey().default(sql`nextval('crop_templates_id_seq')`),
  name: text("name").notNull(),
  variety: text("variety").notNull(),
  growingDays: integer("growing_days").notNull(),
  specialInstructions: text("special_instructions"),
  maintenanceSchedule: jsonb("maintenance_schedule").notNull().default("[]"), // Array of maintenance events
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const cropTemplatesRelations = relations(cropTemplates, ({ many }) => ({
  crops: many(crops),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one }) => ({
  crop: one(crops, {
    fields: [maintenanceSchedules.cropId],
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
  areaId: z.string().uuid().optional(),
  maintenanceSchedule: z.array(z.object({
    eventType: z.string(),
    frequency: z.string(),
    notes: z.string().optional(),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
  })).optional(),
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

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  isActive: true,
}).extend({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
