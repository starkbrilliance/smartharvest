import { 
  crops, 
  events, 
  sessions,
  type Crop, 
  type InsertCrop,
  type Event,
  type InsertEvent,
  type Session,
  type InsertSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  async getCrops(): Promise<Crop[]> {
    return await db.select().from(crops).where(eq(crops.isActive, true)).orderBy(desc(crops.createdAt));
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
}

export const storage = new DatabaseStorage();
