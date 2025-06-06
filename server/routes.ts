import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCropSchema, insertEventSchema, insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getCropAdvice } from "./lib/openai";

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

      if (password !== (process.env.SHARED_PASSWORD || "smartharvest2025")) {
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
      console.error("Error in GET /api/crops:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
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

  // Grow Areas endpoints
  app.get("/api/grow-areas", authenticateSession, async (req, res) => {
    try {
      const areas = await storage.getGrowAreas();
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grow areas" });
    }
  });

  app.post("/api/grow-areas", authenticateSession, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const area = await storage.createGrowArea({ name });
      res.status(201).json(area);
    } catch (error) {
      res.status(500).json({ message: "Failed to create grow area" });
    }
  });

  app.patch("/api/grow-areas/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const area = await storage.updateGrowArea(id, { name });
      if (!area) return res.status(404).json({ message: "Grow area not found" });
      res.json(area);
    } catch (error) {
      res.status(500).json({ message: "Failed to update grow area" });
    }
  });

  app.delete("/api/grow-areas/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGrowArea(id);
      if (!deleted) return res.status(404).json({ message: "Grow area not found" });
      res.json({ message: "Grow area deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete grow area" });
    }
  });

  app.get("/api/grow-areas/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const area = await storage.getGrowAreaById(id);
      if (!area) return res.status(404).json({ message: "Grow area not found" });
      res.json(area);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grow area" });
    }
  });

  // Subareas endpoints
  app.get("/api/grow-areas/:growAreaId/subareas", authenticateSession, async (req, res) => {
    try {
      const { growAreaId } = req.params;
      const subs = await storage.getSubareas(growAreaId);
      res.json(subs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subareas" });
    }
  });

  app.post("/api/grow-areas/:growAreaId/subareas", authenticateSession, async (req, res) => {
    try {
      const { growAreaId } = req.params;
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const sub = await storage.createSubarea({ name, growAreaId });
      res.status(201).json(sub);
    } catch (error) {
      res.status(500).json({ message: "Failed to create subarea" });
    }
  });

  app.patch("/api/subareas/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const sub = await storage.updateSubarea(id, { name });
      if (!sub) return res.status(404).json({ message: "Subarea not found" });
      res.json(sub);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subarea" });
    }
  });

  app.delete("/api/subareas/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSubarea(id);
      if (!deleted) return res.status(404).json({ message: "Subarea not found" });
      res.json({ message: "Subarea deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subarea" });
    }
  });

  // Crop Template routes
  app.get("/api/crop-templates", authenticateSession, async (req, res) => {
    try {
      const templates = await storage.getCropTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crop templates" });
    }
  });

  app.get("/api/crop-templates/search", authenticateSession, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const templates = await storage.searchCropTemplates(q);
      res.json(templates);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to search crop templates" });
    }
  });

  app.post("/api/crop-templates", authenticateSession, async (req, res) => {
    try {
      const { name, variety, growingDays, specialInstructions } = req.body;
      if (!name || !variety || !growingDays) {
        return res.status(400).json({ message: "Name, variety, and growing days are required" });
      }
      const template = await storage.createCropTemplate({
        name,
        variety,
        growingDays,
        specialInstructions,
      });
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to create crop template" });
    }
  });

  app.patch("/api/crop-templates/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const template = await storage.updateCropTemplate(id, updateData);
      if (!template) {
        return res.status(404).json({ message: "Crop template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update crop template" });
    }
  });

  app.delete("/api/crop-templates/:id", authenticateSession, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCropTemplate(id);
      if (!deleted) {
        return res.status(404).json({ message: "Crop template not found" });
      }
      res.json({ message: "Crop template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crop template" });
    }
  });

  // AI-powered crop suggestions
  app.get("/api/crop-templates/ai-suggestions", authenticateSession, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      // This endpoint is deprecated, but keep the old logic for now
      res.json({ suggestions: [] });
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      res.status(500).json({ message: "Failed to get AI suggestions" });
    }
  });

  // AI-powered crop advice for a specific crop and variety
  app.get("/api/crop-templates/advice", authenticateSession, async (req, res) => {
    try {
      const { cropName, variety, context } = req.query;
      if (!cropName || typeof cropName !== 'string' || !variety || typeof variety !== 'string') {
        return res.status(400).json({ message: "Both cropName and variety are required" });
      }
      const advice = await getCropAdvice({
        cropName,
        variety,
        context: typeof context === 'string' ? context : undefined
      });
      if (!advice) {
        return res.status(500).json({ message: "Failed to get AI advice" });
      }
      res.json(advice);
    } catch (error) {
      console.error('Error getting AI advice:', error);
      res.status(500).json({ message: "Failed to get AI advice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
