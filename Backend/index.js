import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Cashfree Production Credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "11077281f181acdf5262a38723e8277011";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "cfsk_ma_prod_07a74006fac339b18a4b690c5b9f68b9_2e31571c";
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";

// Multi-API Key Failover Pool
const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean);

if (API_KEYS.length === 0 && process.env.GROQ_API_KEY) {
  API_KEYS.push(process.env.GROQ_API_KEY);
}

const CHAT_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "groq/compound-mini",
  "groq/compound",
];

async function runGroqChatMultiKey(messages, maxTokens = 350, temperature = 0.4) {
  let lastError = null;

  for (let keyIndex = 0; keyIndex < API_KEYS.length; keyIndex++) {
    const currentKey = API_KEYS[keyIndex];
    const client = new Groq({ apiKey: currentKey });

    for (const model of CHAT_MODELS) {
      try {
        const response = await client.chat.completions.create({
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
          return { reply, modelUsed: model, keyUsedIndex: keyIndex };
        }
      } catch (err) {
        console.warn(`Key #${keyIndex + 1} with Model ${model} failed:`, err?.status || err?.message);
        lastError = err;
        if (err?.status === 429) {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All Groq API keys and models exhausted.");
}

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());

// ---------------- CASHFREE PAYMENT (₹29) ---------------- //
app.post("/create-order", async (req, res) => {
  const { candidateName, role } = req.body;

  if (!candidateName) {
    return res.status(400).json({ error: "Candidate name is required." });
  }

  const orderId = "INTA_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const origin = req.headers.origin || "https://internadda.com";

  const payload = {
    order_id: orderId,
    order_amount: 29.0,
    order_currency: "INR",
    customer_details: {
      customer_id: "CUST_" + Date.now(),
      customer_name: candidateName.trim(),
      customer_email: "candidate@internadda.com",
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: `${origin}/verify-payment?order_id={order_id}`,
    },
    order_note: `InternAdda AI Evaluation Fee for ${role || "Technical Assessment"}`,
  };

  try {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Cashfree Order Error:", data);
      return res.status(500).json({ error: data.message || "Failed to initialize payment gateway." });
    }

    res.json({
      orderId,
      paymentSessionId: data.payment_session_id,
      amount: 29,
    });
  } catch (error) {
    console.error("Cashfree Order Create Error:", error);
    res.status(500).json({ error: "Failed to initiate payment gateway." });
  }
});

app.post("/verify-order", async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "Order ID is required" });

  try {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    const data = await response.json();
    const isPaid = data.order_status === "PAID";
    res.json({ success: isPaid, orderDetails: data });
  } catch (error) {
    console.error("Cashfree Verify Error:", error);
    res.status(500).json({ error: "Failed to verify transaction." });
  }
});

// ---------------- RESUME PDF EXTRACTOR ---------------- //
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

app.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No resume PDF uploaded." });

    const text = await extractTextFromPDF(req.file.buffer);
    if (!text || text.length < 40) {
      return res.status(400).json({
        error: "Could not read text. Please ensure it is an authentic, readable text PDF.",
      });
    }

    res.json({ text });
  } catch (err) {
    console.error("PDF parse error:", err);
    res.status(500).json({ error: "Failed to parse resume PDF." });
  }
});

// ---------------- ADAPTIVE & NATURAL TECHNICAL TERMINAL ENGINE ---------------- //
app.post("/chat", async (req, res) => {
  const { messages, resumeText, role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Assessment role is required." });
  }

  const safeResume = resumeText || "Candidate with technical engineering & analytics projects.";

  const systemPrompt = `You are a Senior Engineering Lead and Technical Interviewer conducting a realistic, conversational 10-turn interview for the role of "${role}".
Candidate Resume:
=== RESUME ===
${safeResume}
=== END ===

CRITICAL OPERATIONAL RULES:

1. USER INTENT DETECTION:
   • If candidate says "skip", "next", "pass", "don't know", or "aage badho": Acknowledge smoothly ("No problem, let's move forward.") and immediately present the next question. Do not lecture.
   • If candidate says "end", "stop", "finish", "submit", "wrap up", or wants to conclude early: Say: "Understood. Wrapping up your assessment and recording your telemetry for review." followed immediately by [ASSESSMENT_COMPLETE].
   • If candidate gives a purely casual greeting like "hey" or "hi": Politely say: "Welcome. Let's dive right into the technical evaluation." and proceed to Question 1.

2. QUESTION MIX (NATURAL & ADAPTIVE):
   • Mix 5 to 6 hard, practical scenario-based challenges with 3 to 4 core conceptual/foundational questions (e.g. debugging strategies, testing workflows, concurrency, or language internals).
   • DEEP FOLLOW-UPS: Each question should organically reference the candidate's previous response. (e.g. "You mentioned using Redis for caching in your last answer. What happens if the cache stampede occurs during a traffic surge?").
   • Derive questions directly from their actual resume stack (libraries, databases, architecture).

3. FORMATTING & TONE:
   • Keep it short, crisp, and conversational (3 to 5 lines maximum).
   • Do NOT use robotic repeated tags like [SCENARIO], [PROBLEM], [QUESTION].
   • Bold key technical terms sparingly. Use clear line breaks and bullet points so it is effortless to read in the terminal.
   • Ask strictly ONE question at a time.

4. WRAP-UP:
   • After 10 completed technical interactions, conclude with:
   "Thank you. Your assessment telemetry and responses have been successfully compiled for the hiring panel." followed immediately by [ASSESSMENT_COMPLETE].`;

  let chatMessages = [];
  if (!messages || messages.length === 0) {
    chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "ASSESSMENT_START: Greet briefly and begin with Question 1 referencing a core project/skill from my resume." }
    ];
  } else {
    chatMessages = [{ role: "system", content: systemPrompt }, ...messages];
    if (chatMessages[chatMessages.length - 1].role !== "user") {
      chatMessages.push({ role: "user", content: "Evaluate my response and ask the next question." });
    }
  }

  try {
    const { reply } = await runGroqChatMultiKey(chatMessages, 350, 0.4);
    const isComplete = reply.includes("[ASSESSMENT_COMPLETE]");
    const cleanReply = reply.replace("[ASSESSMENT_COMPLETE]", "").trim();

    res.json({ reply: cleanReply, isComplete });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "AI Terminal connection timed out. Please retry." });
  }
});

// ---------------- CANDIDATE REPORT ENGINE ---------------- //
app.post("/generate-report", async (req, res) => {
  const { transcript, role, candidateName } = req.body;

  if (!transcript || !role) {
    return res.status(400).json({ error: "Transcript data required." });
  }

  const conversationText = transcript
    .map((m) => `${m.role === "assistant" ? "Examiner" : "Candidate"}: ${m.content}`)
    .join("\n");

  const reportPrompt = `You are an Executive Hiring Committee Director reviewing an assessment for "${role}" candidate "${candidateName || "Candidate"}".
Transcript:
${conversationText}

Generate a fair evaluation report formatted strictly as raw JSON:
{
  "overallScore": 8,
  "recommendation": "Recommend",
  "summary": "Candidate demonstrated solid domain fundamentals and practical problem-solving.",
  "technicalScore": 8,
  "problemSolvingScore": 8,
  "codeQualityScore": 7,
  "strengths": ["Clear Architecture Understanding", "Logical Reasoning"],
  "weaknesses": ["Further depth needed on extreme edge cases"],
  "detailedFeedback": "The candidate provided practical answers across scenarios and fundamentals.",
  "hiringNotes": "Proceed to engineering interview round."
}`;

  try {
    const reportMessages = [
      { role: "system", content: "You output only valid, parseable JSON." },
      { role: "user", content: reportPrompt },
    ];

    const { reply } = await runGroqChatMultiKey(reportMessages, 1000, 0.2);
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON parsed.");

    const report = JSON.parse(jsonMatch[0]);
    res.json({ report });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ error: "Failed to generate assessment report." });
  }
});

app.get("/", (req, res) => res.json({ status: "InternAdda Engine Running with Multi-Key Pool ⚡" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend listening on http://0.0.0.0:${PORT}`)
);
