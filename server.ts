import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import { google } from "googleapis";
import dotenv from "dotenv";

import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3080;
const app = express();
app.use(express.json());

// Initialize Firebase Admin
let isAdminInitialized = false;
try {
  admin.initializeApp();
  isAdminInitialized = true;
  console.log("Firebase Admin successfully initialized.");
} catch (error) {
  console.warn("Firebase Admin failed to initialize. Falling back to server credentials.", error);
}

// Middleware to fetch settings keys securely using Firebase ID Token
const checkAuthAndGetKeys = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  (req as any).userKeys = { openaiKey: "", geminiKey: "" };
  if (!isAdminInitialized) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split(" ")[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      const databaseId = process.env.FIREBASE_DATABASE_ID || "ai-studio-nextgen2026-701436e8-1e5d-459c-a0c8-19ff82190f5f";
      const firestoreDb = getFirestore(undefined, databaseId);
      const docRef = firestoreDb.doc(`users/${uid}/profile/settings`);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        (req as any).userKeys = {
          openaiKey: data?.openaiKey || "",
          geminiKey: data?.geminiKey || ""
        };
      }
    } catch (error) {
      console.warn("Failed to retrieve user keys from Firestore:", error);
    }
  }
  next();
};

app.use(checkAuthAndGetKeys);

// Initialize Gemini
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// Initialize OpenAI
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Google Calendar Auth Helper
const getCalendarClient = (authHeader?: string) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  return google.calendar({ version: "v3", auth: oauth2Client });
};

app.get("/api/calendar/list", async (req, res) => {
  const calendar = getCalendarClient(req.headers.authorization);
  if (!calendar) return res.status(401).json({ error: "Unauthorized" });

  try {
    const response = await calendar.calendarList.list();
    res.json(response.data.items || []);
  } catch (error) {
    console.error("Calendar List Error:", error);
    res.status(500).json({ error: "Failed to fetch calendars" });
  }
});

app.get("/api/calendar/events", async (req, res) => {
  const calendar = getCalendarClient(req.headers.authorization);
  if (!calendar) return res.status(401).json({ error: "Unauthorized" });

  const { calendarId, timeMin, timeMax } = req.query;

  try {
    const response = await calendar.events.list({
      calendarId: calendarId as string,
      timeMin: timeMin as string || new Date().toISOString(),
      timeMax: (timeMax as string) || undefined,
      singleEvents: true,
      orderBy: "startTime",
    });
    res.json(response.data.items || []);
  } catch (error) {
    console.error("Calendar Events Error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post("/api/calendar/create-event", async (req, res) => {
  const calendar = getCalendarClient(req.headers.authorization);
  if (!calendar) return res.status(401).json({ error: "Unauthorized" });

  const { event } = req.body;

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Calendar Create Event Error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.post("/api/calendar/extract-events", async (req, res) => {
  const { content, model } = req.body;
  const { openaiKey: userOpenAiKey, geminiKey: userGeminiKey } = (req as any).userKeys || {};

  const prompt = `
    Analiza el siguiente texto y extrae posibles eventos de calendario.
    Texto: "${content}"

    Debes identificar:
    1. Resumen/Título del evento.
    2. Descripción.
    3. Fecha y hora de inicio (formato ISO 8601).
    4. Fecha y hora de fin (formato ISO 8601).
    
    Si no hay fecha específica, asume que es para mañana a las 10:00 AM.
    Si solo hay una fecha sin hora, asume que dura 1 hora.
    
    Devuelve estrictamente un JSON con un array 'events' que contenga objetos compatibles con Google Calendar API:
    {
      "events": [
        {
          "summary": "Título",
          "description": "Descripción",
          "start": { "dateTime": "ISO_DATE_TIME", "timeZone": "UTC" },
          "end": { "dateTime": "ISO_DATE_TIME", "timeZone": "UTC" }
        }
      ]
    }
  `;

  try {
    const text = await generateAIResponse(prompt, model, userOpenAiKey, userGeminiKey);
    res.json(JSON.parse(text || '{"events":[]}'));
  } catch (error) {
    console.error("Extraction Error:", error);
    res.status(500).json({ error: "Failed to extract events" });
  }
});

// AI Helper Function
async function generateAIResponse(prompt: string, model?: string, userOpenAiKey?: string, userGeminiKey?: string) {
  const selectedModel = model || "gemini-2.0-flash";

  // If OpenAI model is requested
  if (selectedModel.startsWith("gpt")) {
    let client = openai;
    if (userOpenAiKey) {
      client = new OpenAI({ apiKey: userOpenAiKey });
    }

    if (!client) throw new Error("OpenAI not configured");
    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: "system", content: "Responde siempre en español y devuelve estrictamente JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    return response.choices[0].message.content;
  }

  // Default to Gemini
  let client = genAI;
  if (userGeminiKey) {
    client = new GoogleGenAI({ apiKey: userGeminiKey });
  }

  if (!client) throw new Error("Gemini not configured");
  const response = await client.models.generateContent({
    model: selectedModel,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "Responde siempre en español y devuelve estrictamente JSON.",
      responseMimeType: "application/json",
    }
  });
  return response.text;
}

// Pia AI Accountability Partner
app.post("/api/pia", async (req, res) => {
  const { task, context, action, model } = req.body;
  const { openaiKey: userOpenAiKey, geminiKey: userGeminiKey } = (req as any).userKeys || {};
  
  const prompt = `
    Eres Pia, una socia proactiva de rendición de cuentas para una aplicación de productividad de alto rendimiento.
    Tarea del Usuario: ${JSON.stringify(task)}
    Contexto: ${context}
    Acción/Retraso del Usuario: ${action}

    Tu objetivo es proporcionar una respuesta empática pero firme en ESPAÑOL.
    Si hay un retraso, ofrece opciones como "empezar ahora (micro-objetivo de 5 min)", "reprogramar (recalibración algorítmica)" o "delegar".
    Combate la "ceguera temporal" y evita avergonzar al usuario.
    Mantén la respuesta breve, táctica y de apoyo.
    Devuelve estrictamente JSON con los campos: 'message', 'suggestedActions' (array de strings).
  `;

  try {
    const text = await generateAIResponse(prompt, model, userOpenAiKey, userGeminiKey);
    res.json(JSON.parse(text || "{}"));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI Processing failed" });
  }
});

// Recalibration Logic (Motion-inspired)
app.post("/api/recalibrate", (req, res) => {
  const { tasks, focusHours } = req.body;
  // This is a simplified "Motion" algorithm
  // It would sort by priority and pack into focus blocks
  const recalibratedTasks = [...tasks].sort((a, b) => {
    const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });

  res.json({ 
    tasks: recalibratedTasks, 
    message: "Algorithmic recalibration complete. Priority map synchronized." 
  });
});

// Cerebro LLM Wiki Query
app.post("/api/cerebro/query", async (req, res) => {
  const { query, notes, model } = req.body;
  const { openaiKey: userOpenAiKey, geminiKey: userGeminiKey } = (req as any).userKeys || {};
  
  const prompt = `
    Eres el "Cerebro Externo", un asistente inteligente que gestiona una base de conocimientos (Wiki).
    El usuario tiene las siguientes notas registradas:
    ${JSON.stringify(notes)}

    Pregunta del Usuario: "${query}"

    Tu objetivo es:
    1. Responder la pregunta basándote en la información de las notas.
    2. Si la información no está en las notas, menciónalo pero intenta dar una respuesta estratégica general.
    3. Sugiere conexiones entre notas si las detectas.
    4. Proporciona una respuesta en ESPAÑOL, con tono profesional y estratégico.

    Devuelve estrictamente JSON con los campos: 'answer', 'relatedNotes' (array de ids de notas mencionadas), 'suggestedStrategy'.
  `;

  try {
    const text = await generateAIResponse(prompt, model, userOpenAiKey, userGeminiKey);
    res.json(JSON.parse(text || "{}"));
  } catch (error) {
    console.error("Cerebro Error:", error);
    res.status(500).json({ error: "Wiki processing failed" });
  }
});

// Cerebro Graph Analysis
app.post("/api/cerebro/analyze-graph", async (req, res) => {
  const { notes, model } = req.body;
  const { openaiKey: userOpenAiKey, geminiKey: userGeminiKey } = (req as any).userKeys || {};
  
  const prompt = `
    Analiza las siguientes notas y determina cómo se conectan entre sí conceptualmente.
    Notas: ${JSON.stringify(notes)}

    Tu objetivo es:
    1. Crear un grafo de conexiones.
    2. Identificar "clusters" o temas comunes.
    3. Devolver un JSON con la estructura:
       {
         "nodes": [{"id": "id_nota", "label": "título_corto", "val": 1-10 (importancia), "group": "nombre_tema"}],
         "links": [{"source": "id_origen", "target": "id_destino", "label": "relación"}]
       }
    
    Sé creativo con las conexiones, busca temas latentes. Responde estrictamente JSON.
  `;

  try {
    const text = await generateAIResponse(prompt, model, userOpenAiKey, userGeminiKey);
    res.json(JSON.parse(text || '{"nodes":[], "links":[]}'));
  } catch (error) {
    console.error("Graph Analysis Error:", error);
    res.json({ nodes: [], links: [], error: "Analisis fallido" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NextGen 2026 Server running on http://localhost:${PORT}`);
  });
}

startServer();
