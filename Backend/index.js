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

const CHAT_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "groq/compound-mini",
  "groq/compound",
];

async function runGroqChat(messages, maxTokens = 350, temperature = 0.6) {
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

// Chat Engine with Tough Technical Interviewer Persona
app.post("/chat", async (req, res) => {
  const { messages, resumeText, role, experienceLevel } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Missing required role." });
  }

  const safeResume = resumeText || "No resume provided. Candidate is interviewing without prior context.";

  const systemPrompt = `You are a Principal Technical Interviewer conducting a demanding, realistic job interview for the role of "${role}" (${experienceLevel || "Mid-to-Senior"} level).
You have full access to the candidate's resume:
=== CANDIDATE RESUME ===
${safeResume}
=== END RESUME ===

INTERVIEW GUIDELINES & PERSONA:
1. Tone: Professional, articulate, rigorous, and direct. You are evaluating depth of experience, problem-solving under pressure, and architectural clarity.
2. Structure:
   - Question 1: Brief professional greeting, acknowledge their background, and ask a specific, challenging question about an actual project, tool, or metric mentioned in their resume.
   - Subsequent Questions: Listen closely to their response. If their answer is generic or textbook, push deeper ("How did you handle race conditions in that system?", "What specific tradeoffs did you make?", "Can you quantify the latency reduction?").
   - Challenge their claims: Do not merely nod along. Probe edge cases, failure scenarios, and scalability bottlenecks.
   - Progress through: (1) Deep-dive into resume projects, (2) Real-world system design/problem scenario for the "${role}" position, (3) Edge-case troubleshooting, (4) One high-stakes leadership or conflict question.
3. Strict Constraints:
   - Always respond in plain conversational text. NO bullet points, NO Markdown headers, NO JSON formatting.
   - Ask EXACTLY ONE question at a time. Never ask compound questions.
   - Keep each turn crisp (maximum 2 to 3 sentences).
   - Never validate their answers with praise like "Great answer!" or "Awesome!". Remain neutral ("Understood.", "Got it.", "Makes sense.").
   - After 7 to 9 rigorous turns, gracefully conclude the session by saying exactly:
     "Thank you for sharing your experience today. That completes our technical evaluation session. Our team will review the telemetry and follow up with you shortly." followed by [INTERVIEW_COMPLETE].`;

  let chatMessages = [];
  if (!messages || messages.length === 0) {
    chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Hello, I am ready to begin the interview. Please introduce yourself and start with the first question." }
    ];
  } else {
    chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    if (chatMessages[chatMessages.length - 1].role !== "user") {
      chatMessages.push({ role: "user", content: "Please continue the interview based on my response." });
    }
  }

  try {
    const { reply } = await runGroqChat(chatMessages, 350, 0.65);

    const isComplete = reply.includes("[INTERVIEW_COMPLETE]");
    const cleanReply = reply.replace("[INTERVIEW_COMPLETE]", "").trim();

    res.json({ reply: cleanReply, isComplete });
  } catch (err) {
    console.error("Chat failure:", err);
    res.status(500).json({ error: "AI failed to respond. Try again." });
  }
});

// Generate Comprehensive Evaluation Report
app.post("/generate-report", async (req, res) => {
  const { transcript, role, experienceLevel, candidateName } = req.body;

  if (!transcript || !role || !candidateName) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const conversationText = transcript
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n");

  const reportPrompt = `You are the Bar Raiser and Hiring Committee Lead. Conduct a rigorous, critical evaluation of candidate "${candidateName}" for the position "${role}" (${experienceLevel} level).
Transcript:
${conversationText}

Produce a strict JSON report with realistic, uninflated scores (scale 1-10):
{
  "overallScore": 7,
  "recommendation": "<Strongly Recommend | Recommend | Neutral | Do Not Recommend>",
  "summary": "<3-sentence executive verdict evaluating their depth vs senior expectations>",
  "technicalScore": 7,
  "communicationScore": 8,
  "confidenceScore": 7,
  "strengths": ["<Specific practical strength>", "<Architecture/metric understanding>"],
  "weaknesses": ["<Identified blind spot or vague answer>", "<Edge-case deficiency>"],
  "topicsCovered": ["<Topic 1>", "<Topic 2>", "<Topic 3>"],
  "detailedFeedback": "<Detailed paragraph analyzing their problem-solving ability, honesty regarding unknown concepts, and domain mastery>",
  "hiringNotes": "<Direct hiring recommendation notes for the engineering director>"
}`;

  try {
    const reportMessages = [
      { role: "system", content: "You are an executive hiring evaluation model that outputs ONLY valid JSON." },
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
