import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());

// Models confirmed active on your Groq key
const CHAT_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "groq/compound-mini",
  "groq/compound",
];

// Helper to run chat completions safely across available models
async function runGroqChat(messages, maxTokens = 300, temperature = 0.7) {
  let lastError = null;
  for (const model of CHAT_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      let reply = response.choices?.[0]?.message?.content || "";

      // Clean tool call artifacts if model wraps in JSON
      if (!reply && response.choices?.[0]?.message?.tool_calls?.length) {
        const toolCall = response.choices[0].message.tool_calls[0];
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          reply = parsed.text || parsed.message || parsed.reply || Object.values(parsed)[0];
        } catch {
          reply = toolCall.function.arguments;
        }
      }

      if (reply) {
        return { reply, modelUsed: model };
      }
    } catch (err) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      // If error contains failed_generation, extract reply text directly
      if (err?.error?.failed_generation) {
        try {
          const raw = err.error.failed_generation;
          const match = raw.match(/arguments":\s*"([^"]+)"/) || raw.match(/arguments":\s*\{[^}]*"text":\s*"([^"]+)"/);
          if (match && match[1]) {
            return { reply: match[1], modelUsed: model };
          }
        } catch (parseErr) {
          console.error("Failed extracting generation from error:", parseErr);
        }
      }
      lastError = err;
    }
  }
  throw lastError || new Error("All models failed to respond.");
}

// PDF Parser
async function extractTextFromPDF(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocument({ data: uint8Array }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

// Resume Upload
app.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const text = await extractTextFromPDF(req.file.buffer);
    if (!text || text.length < 50) {
      return res.status(400).json({
        error: "Could not extract text. Make sure it's not a scanned image.",
      });
    }

    res.json({ text });
  } catch (err) {
    console.error("PDF parse error:", err);
    res.status(500).json({ error: "Failed to parse PDF." });
  }
});

// Chat / Interview Engine
app.post("/chat", async (req, res) => {
  const { messages, resumeText, role, experienceLevel } = req.body;

  if (!messages || !role) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const levelDescriptions = {
    fresher: "0-1 years of experience, fresh graduate",
    junior: "1-2 years of experience",
    mid: "2-4 years of experience",
    senior: "4+ years of experience",
  };

  const safeResume = resumeText || "No resume provided. Ask general technical questions for the role.";

  const systemPrompt = `You are a professional technical interviewer conducting a real job interview for the role of "${role}" (${
    levelDescriptions[experienceLevel] || experienceLevel || "mid"
  }).
You have access to the candidate's resume:
=== RESUME START ===
${safeResume}
=== RESUME END ===

Rules:
1. Output plain conversational text only. Do not call functions, tools, or output JSON format.
2. Ask ONLY ONE question at a time.
3. Greet candidate briefly and ask about their resume background/project.
4. Keep questions concise (1-2 sentences).
5. After 8-10 questions, wrap up with: "That's all the questions I have. Thank you for your time today — we'll be in touch soon." followed by [INTERVIEW_COMPLETE].
6. Never repeat a question.`;

  try {
    const chatMessages = [{ role: "system", content: systemPrompt }, ...messages];
    const { reply } = await runGroqChat(chatMessages, 300, 0.7);

    const isComplete = reply.includes("[INTERVIEW_COMPLETE]");
    const cleanReply = reply.replace("[INTERVIEW_COMPLETE]", "").trim();

    res.json({ reply: cleanReply, isComplete });
  } catch (err) {
    console.error("Final Groq chat failure:", err);
    res.status(500).json({ error: "AI failed to respond. Try again." });
  }
});

// Generate Report
app.post("/generate-report", async (req, res) => {
  const { transcript, role, experienceLevel, candidateName } = req.body;

  if (!transcript || !role || !candidateName) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const conversationText = transcript
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n");

  const reportPrompt = `You are a senior hiring manager reviewing a job interview for "${role}" (${experienceLevel} level) with candidate "${candidateName}".
Here is the interview transcript:
=== TRANSCRIPT START ===
${conversationText}
=== TRANSCRIPT END ===

Generate an evaluation report in this exact JSON structure (only JSON, no surrounding text):
{
  "overallScore": 8,
  "recommendation": "Recommend",
  "summary": "Candidate showed strong foundational skills.",
  "technicalScore": 8,
  "communicationScore": 8,
  "confidenceScore": 7,
  "strengths": ["Skill 1", "Skill 2"],
  "weaknesses": ["Area 1", "Area 2"],
  "topicsCovered": ["Topic 1", "Topic 2"],
  "detailedFeedback": "Candidate answered questions clearly and demonstrated practical knowledge.",
  "hiringNotes": "Suitable for next interview round."
}`;

  try {
    const { reply } = await runGroqChat([{ role: "user", content: reportPrompt }], 1000, 0.3);
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const report = JSON.parse(jsonMatch[0]);
    res.json({ report });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

app.get("/", (req, res) => res.json({ status: "Backend running 🚀" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on http://0.0.0.0:${PORT}`)
);
