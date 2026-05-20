import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Note: __filename and __dirname are globals in CommonJS, no import.meta needed.

async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode`);

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

  // API Routes
  app.post("/api/generate-post", async (req, res) => {
    try {
      const { property, agent, platform, tone } = req.body;
      
      const prompt = `Generate a highly engaging ${platform} post for a real estate listing.
      
      Property details:
      - Title: ${property.title}
      - Price: R ${property.price}
      - Location: ${property.area}, ${property.city}
      - Features: ${property.beds} beds, ${property.baths} baths, ${property.parking} parking
      - Description: ${property.description}
      
      Agent details:
      - Name: ${agent.full_name}
      - Email: ${agent.email}
      
      Tone: ${tone || 'Professional and exciting'}
      
      Please provide:
      1. A catchy headline
      2. The main body text
      3. Relevant hashtags
      
      Format the response as JSON with keys: "headline", "body", "hashtags" (array).`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      res.json(JSON.parse(result.text || '{}'));
    } catch (error: any) {
      console.error("Gemini error:", error);
      res.status(500).json({ error: "Failed to generate post", details: error.message });
    }
  });

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Vite + Production config
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
