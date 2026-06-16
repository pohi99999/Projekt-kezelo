import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes first
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY hiányzik a környezeti változókból. Kérjük, állítsa be az AI Studio UI Secrets paneljén." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const { messages, projects, tasks } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Hiányzó vagy érvénytelen 'messages' tömb." });
      }

      const systemInstruction = `
Te egy rendkívül segítőkész és intelligens Projekt Tervező Asszisztens vagy (Project Planner Assistant) a felhasználó saját projekttervező alkalmazásán belül.
Az alkalmazás egy modern, letisztult sötét témájú felület kártyás elrendezéssel, ahol a felhasználók projekteket vihetnek fel, és azokhoz feladatokat rendelhetnek napi és heti nézetben. Ha egy feladatot kipipálnak, az eltűnik.

A feladatod:
- Segíts megtervezni és felépíteni a feladatokat. Ha a felhasználó egy projektről vagy egy célról beszél, javasolj neki konkrete feladatokat napi vagy heti bontásban.
- Mindig magyar nyelven válaszolj, barátságos, professzionális, segítőkész és biztató hangnemben!

Az alkalmazás JELENLEGI állapota:
PROJEKTEK LISTÁJA:
${JSON.stringify(projects || [], null, 2)}

FÉLKÉSZ FELADATOK LISTÁJA (befejezetlenek):
${JSON.stringify(tasks || [], null, 2)}

Interaktív feladattervezés:
Ha konkrét feladatokat javasolsz a meglévő projektek valamelyikéhez, a válaszod végén (vagy a szövegeden kívül) KÖTELEZŐ jelleggel helyezz el egy speciális suggested_tasks blokkot JSON formátumban!
Ebből a blokkból az alkalmazás gombokat generál, amivel a felhasználó egyetlen kattintással ténylegesen hozzáadhatja őket a rendszerhez!

Példa a sugallt feladatok formátumára (másold le pontosan ezt a markdown formátumot, ha feladatokat javasolsz):
\`\`\`suggested_tasks
[
  {
    "projectId": "p1",
    "title": "Első teendő megfogalmazása",
    "dueDateDaysOffset": 1
  },
  {
    "projectId": "p2",
    "title": "Második teendő egy hét múlva",
    "dueDateDaysOffset": 7
  }
]
\`\`\`

A "projectId" értékének pontosan egyeznie kell a fenti projektek listájában szereplő ID-k egyikével (pl. p1, p2 vagy a felhasználó által dinamikusan választott id-k). Ha nem tudod pontosan, válaszd ki a legrelevánsabbat, vagy hozd létre a meglévőkre.
A "dueDateDaysOffset" kulcs azt jelzi, hogy ma-hoz képest hány nap múlva esedékes a feladat (pl. 1 = holnap/másnap, 7 = egyhét múlva, 0 = ma).
Mindig törekedj arra, hogy adj javaslatokat a fenti JSON blokkban, miközben magyarázatot is adsz rá a válaszodban!
`;

      const formattedMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Hiba a Gemini proxy endpointon:", error);
      return res.status(500).json({ error: error.message || "Szerveroldali hiba történt a Gemini hívás közben." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
