import {
  crops,
  events,
  sessions,
  cropTemplates,
  type Crop,
  type InsertCrop,
  type Event,
  type InsertEvent,
  type Session,
  type InsertSession,
  growAreas,
  subareas
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Crops
  getCrops(): Promise<Crop[]>;
  getCropById(id: string): Promise<Crop | undefined>;
  createCrop(crop: InsertCrop): Promise<Crop>;
  updateCrop(id: string, crop: Partial<InsertCrop>): Promise<Crop | undefined>;
  deleteCrop(id: string): Promise<boolean>;

  // Events
  getEventsByCropId(cropId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Authentication
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<boolean>;

  // Grow Areas
  getGrowAreas(): Promise<any[]>;
  getGrowAreaById(id: string): Promise<any | undefined>;
  createGrowArea(data: { name: string }): Promise<any>;
  updateGrowArea(id: string, data: { name: string }): Promise<any | undefined>;
  deleteGrowArea(id: string): Promise<boolean>;

  // Subareas
  getSubareas(growAreaId: string): Promise<any[]>;
  getSubareaById(id: string): Promise<any | undefined>;
  createSubarea(data: { name: string, growAreaId: string }): Promise<any>;
  updateSubarea(id: string, data: { name: string }): Promise<any | undefined>;
  deleteSubarea(id: string): Promise<boolean>;

  // Crop Templates
  getCropTemplates(): Promise<any[]>;
  getCropTemplateById(id: string): Promise<any | undefined>;
  createCropTemplate(data: { name: string; variety: string; growingDays: number; specialInstructions?: string }): Promise<any>;
  updateCropTemplate(id: string, data: { name?: string; variety?: string; growingDays?: number; specialInstructions?: string }): Promise<any | undefined>;
  deleteCropTemplate(id: string): Promise<boolean>;
  searchCropTemplates(query: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getCrops(): Promise<Crop[]> {
    try {
      return await db
        .select({
          id: crops.id,
          name: crops.name,
          variety: crops.variety,
          subareaId: crops.subareaId,
          areaId: crops.areaId,
          plantedDate: crops.plantedDate,
          expectedHarvestDate: crops.expectedHarvestDate,
          actualHarvestDate: crops.actualHarvestDate,
          status: crops.status,
          notes: crops.notes,
          imageUrl: crops.imageUrl,
          isActive: crops.isActive,
          createdAt: crops.createdAt
        })
        .from(crops)
        .where(eq(crops.isActive, true))
        .orderBy(desc(crops.createdAt));
    } catch (error) {
      console.error("Database error in getCrops:", error);
      throw error;
    }
  }

  async getCropById(id: string): Promise<Crop | undefined> {
    const [crop] = await db.select().from(crops).where(and(eq(crops.id, id), eq(crops.isActive, true)));
    return crop || undefined;
  }

  async createCrop(insertCrop: InsertCrop): Promise<Crop> {
    const [crop] = await db
      .insert(crops)
      .values(insertCrop)
      .returning();
    return crop;
  }

  async updateCrop(id: string, updateData: Partial<InsertCrop>): Promise<Crop | undefined> {
    const [crop] = await db
      .update(crops)
      .set(updateData)
      .where(eq(crops.id, id))
      .returning();
    return crop || undefined;
  }

  async deleteCrop(id: string): Promise<boolean> {
    const [crop] = await db
      .update(crops)
      .set({ isActive: false })
      .where(eq(crops.id, id))
      .returning();
    return !!crop;
  }

  async getEventsByCropId(cropId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.cropId, cropId)).orderBy(desc(events.eventDate));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.sessionToken, token),
        eq(sessions.isAuthenticated, true),
        gte(sessions.expiresAt, new Date())
      ));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<boolean> {
    const [session] = await db
      .update(sessions)
      .set({ isAuthenticated: false })
      .where(eq(sessions.sessionToken, token))
      .returning();
    return !!session;
  }

  async getGrowAreas(): Promise<any[]> {
    return await db.select().from(growAreas);
  }

  async getGrowAreaById(id: string): Promise<any | undefined> {
    const [area] = await db.select().from(growAreas).where(eq(growAreas.id, id));
    return area || undefined;
  }

  async createGrowArea(data: { name: string }): Promise<any> {
    const [area] = await db.insert(growAreas).values({ name: data.name }).returning();
    return area;
  }

  async updateGrowArea(id: string, data: { name: string }): Promise<any | undefined> {
    const [area] = await db.update(growAreas).set({ name: data.name }).where(eq(growAreas.id, id)).returning();
    return area || undefined;
  }

  async deleteGrowArea(id: string): Promise<boolean> {
    const [area] = await db.delete(growAreas).where(eq(growAreas.id, id)).returning();
    return !!area;
  }

  async getSubareas(growAreaId: string): Promise<any[]> {
    return await db.select().from(subareas).where(eq(subareas.growAreaId, growAreaId));
  }

  async getSubareaById(id: string): Promise<any | undefined> {
    const [sub] = await db.select().from(subareas).where(eq(subareas.id, id));
    return sub || undefined;
  }

  async createSubarea(data: { name: string, growAreaId: string }): Promise<any> {
    const [sub] = await db.insert(subareas).values(data).returning();
    return sub;
  }

  async updateSubarea(id: string, data: { name: string }): Promise<any | undefined> {
    const [sub] = await db.update(subareas).set({ name: data.name }).where(eq(subareas.id, id)).returning();
    return sub || undefined;
  }

  async deleteSubarea(id: string): Promise<boolean> {
    const [sub] = await db.delete(subareas).where(eq(subareas.id, id)).returning();
    return !!sub;
  }

  async getCropTemplates(): Promise<any[]> {
    return await db.select().from(cropTemplates);
  }

  async getCropTemplateById(id: string): Promise<any | undefined> {
    const [template] = await db.select().from(cropTemplates).where(eq(cropTemplates.id, id));
    return template || undefined;
  }

  async createCropTemplate(data: { name: string; variety: string; growingDays: number; specialInstructions?: string }): Promise<any> {
    const [template] = await db
      .insert(cropTemplates)
      .values(data)
      .returning();
    return template;
  }

  async updateCropTemplate(id: string, data: { name?: string; variety?: string; growingDays?: number; specialInstructions?: string }): Promise<any | undefined> {
    const [template] = await db
      .update(cropTemplates)
      .set(data)
      .where(eq(cropTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteCropTemplate(id: string): Promise<boolean> {
    const [template] = await db
      .delete(cropTemplates)
      .where(eq(cropTemplates.id, id))
      .returning();
    return !!template;
  }

  async searchCropTemplates(query: string): Promise<any[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(cropTemplates)
      .where(
        or(
          ilike(cropTemplates.name, searchQuery),
          ilike(cropTemplates.variety, searchQuery)
        )
      );
  }
}

export const storage = new DatabaseStorage();
