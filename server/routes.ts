import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCropSchema, insertEventSchema, insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

const authenticateSession = async (req: any, res: any, next: any) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ message: "No session token provided" });
  }

  const session = await storage.getSessionByToken(sessionToken);
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  req.session = session;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (password !== (process.env.SHARED_PASSWORD || "growtrack2024")) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const sessionToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const session = await storage.createSession({
        sessionToken,
        expiresAt,
      });

      res.json({ sessionToken: session.sessionToken });
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", authenticateSession, async (req, res) => {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') || '';
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Crop routes
  app.get("/api/crops", authenticateSession, async (req, res) => {
    try {
      const crops = await storage.getCrops();
      res.json(crops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crops" });
    }
  });

  app.get("/api/crops/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const crop = await storage.getCropById(id);
      
      if (!crop) {
        return res.status(404).json({ message: "Crop not found" });
      }

      const events = await storage.getEventsByCropId(id);
      res.json({ ...crop, events });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crop" });
    }
  });

  app.post("/api/crops", authenticateSession, async (req, res) => {
    try {
      const cropData = insertCropSchema.parse(req.body);
      const crop = await storage.createCrop(cropData);
      res.status(201).json(crop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid crop data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create crop" });
    }
  });

  app.patch("/api/crops/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const crop = await storage.updateCrop(id, updateData);
      if (!crop) {
        return res.status(404).json({ message: "Crop not found" });
      }

      res.json(crop);
    } catch (error) {
      res.status(500).json({ message: "Failed to update crop" });
    }
  });

  app.delete("/api/crops/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCrop(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Crop not found" });
      }

      res.json({ message: "Crop deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crop" });
    }
  });

  // Event routes
  app.get("/api/crops/:id/events", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const events = await storage.getEventsByCropId(id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/crops/:id/events", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const eventData = insertEventSchema.parse({
        ...req.body,
        cropId: id,
      });
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
