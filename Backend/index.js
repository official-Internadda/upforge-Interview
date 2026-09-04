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

// Models confirmed on your account
const CHAT_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "groq/compound-mini",
  "groq/compound",
];

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

  if (!role) {
    return res.status(400).json({ error: "Missing required role." });
  }

  const levelDescriptions = {
    fresher: "0-1 years of experience, fresh graduate",
    junior: "1-2 years of experience",
    mid: "2-4 years of experience",
    senior: "4+ years of experience",
  };

  const safeResume = resumeText || "No resume provided. Ask standard technical questions.";

  const systemPrompt = `You are a professional technical interviewer conducting a real job interview for the role of "${role}" (${
    levelDescriptions[experienceLevel] || experienceLevel || "mid"
  }).
Candidate Resume Details:
=== RESUME START ===
${safeResume}
=== RESUME END ===

Rules:
1. Always respond in plain conversational English text only. Never use function calls, tool calls, or JSON objects.
2. Ask ONLY ONE question at a time.
3. First question must be a short polite greeting and asking about their background or a specific project on their resume.
4. Keep all responses concise (1 to 2 sentences maximum).
5. Wrap up after 8-10 questions by saying: "That's all the questions I have. Thank you for your time today — we'll be in touch soon." followed by [INTERVIEW_COMPLETE].
6. Never repeat a question already asked.`;

  // Fix: Ensure messages array is never empty and ends with user role
  let chatMessages = [];
  if (!messages || messages.length === 0) {
    chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Hello, I am ready. Please introduce yourself and ask the first question." }
    ];
  } else {
    chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    // If the last message is not from user, append a prompt
    if (chatMessages[chatMessages.length - 1].role !== "user") {
      chatMessages.push({ role: "user", content: "Please continue the interview." });
    }
  }

  try {
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

  const reportPrompt = `You are a senior hiring manager. Review this interview for "${role}" (${experienceLevel} level) with candidate "${candidateName}".
Transcript:
${conversationText}

Output strictly valid JSON with this exact schema (no additional commentary or markdown):
{
  "overallScore": 8,
  "recommendation": "Recommend",
  "summary": "Candidate demonstrated strong domain knowledge and clear communication.",
  "technicalScore": 8,
  "communicationScore": 8,
  "confidenceScore": 8,
  "strengths": ["Problem Solving", "Domain Fundamentals"],
  "weaknesses": ["Needs more deep dive on edge cases"],
  "topicsCovered": ["Experience", "Projects", "Technical Questions"],
  "detailedFeedback": "The candidate answered all core questions accurately.",
  "hiringNotes": "Proceed to the next round."
}`;

  try {
    const reportMessages = [
      { role: "system", content: "You are an automated evaluation system that outputs only raw JSON." },
      { role: "user", content: reportPrompt }
    ];

    const { reply } = await runGroqChat(reportMessages, 1000, 0.2);
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
