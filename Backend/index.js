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

// Cashfree Production Credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "11077281f181acdf5262a38723e8277011";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "cfsk_ma_prod_07a74006fac339b18a4b690c5b9f68b9_2e31571c";
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";

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

async function runGroqChat(messages, maxTokens = 400, temperature = 0.5) {
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

      if (reply) return { reply, modelUsed: model };
    } catch (err) {
      console.warn(`Model ${model} error:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All AI models failed to respond.");
}

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
    order_amount: 1.0, // Set to ₹29
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

// ---------------- TECHNICAL TERMINAL ENGINE ---------------- //
app.post("/chat", async (req, res) => {
  const { messages, resumeText, role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Assessment role is required." });
  }

  const safeResume = resumeText || "General Candidate with no specific resume text provided.";

  const systemPrompt = `You are a Principal Technical Interviewer and Evaluation Lead conducting a comprehensive 10-Question Technical Terminal Assessment for the role of "${role}".
Candidate Resume Context:
=== RESUME START ===
${safeResume}
=== RESUME END ===

OPERATIONAL RULES:
1. Speak in a crisp, direct, enterprise technical interviewer tone.
2. Ask strictly 10 questions sequentially.
3. Every question must test real-world depth: architecture, syntax edge cases, performance bottlenecks, databases, or specific tooling mentioned in the candidate's resume.
4. Turn 1: Professional greeting. Call out a specific technology/project from their resume and ask a deep conceptual or diagnostic question.
5. Turns 2 to 9: Critically review their submitted response or code. If superficial, probe their logic or ask how they would resolve failure conditions.
6. Ask EXACTLY ONE question at a time. Maximum 2 to 3 sentences per turn.
7. Turn 10 Completion: When the assessment concludes, say: "Thank you. Your assessment telemetry and terminal responses have been indexed." followed by [ASSESSMENT_COMPLETE].`;

  let chatMessages = [];
  if (!messages || messages.length === 0) {
    chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "ASSESSMENT_START: Candidate is verified and active at the terminal." }
    ];
  } else {
    chatMessages = [{ role: "system", content: systemPrompt }, ...messages];
    if (chatMessages[chatMessages.length - 1].role !== "user") {
      chatMessages.push({ role: "user", content: "Proceed with the next technical question." });
    }
  }

  try {
    const { reply } = await runGroqChat(chatMessages, 350, 0.5);
    const isComplete = reply.includes("[ASSESSMENT_COMPLETE]");
    const cleanReply = reply.replace("[ASSESSMENT_COMPLETE]", "").trim();

    res.json({ reply: cleanReply, isComplete });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "AI Terminal connection timed out. Please retry." });
  }
});

// ---------------- EVALUATION REPORT ENGINE ---------------- //
app.post("/generate-report", async (req, res) => {
  const { transcript, role, candidateName } = req.body;

  if (!transcript || !role) {
    return res.status(400).json({ error: "Transcript data required." });
  }

  const conversationText = transcript
    .map((m) => `${m.role === "assistant" ? "Examiner" : "Candidate"}: ${m.content}`)
    .join("\n");

  const reportPrompt = `You are the Engineering Director reviewing an assessment for "${role}" candidate "${candidateName || "Candidate"}".
Transcript:
${conversationText}

Generate a rigorous evaluation report formatted strictly as raw JSON:
{
  "overallScore": 8,
  "recommendation": "Recommend",
  "summary": "Candidate demonstrated solid grasp of practical problem solving.",
  "technicalScore": 8,
  "problemSolvingScore": 7,
  "codeQualityScore": 8,
  "strengths": ["Domain Fundamentals", "Clear Algorithmic Reasoning"],
  "weaknesses": ["Deep dive on distributed edge cases"],
  "detailedFeedback": "The candidate provided direct answers and demonstrated practical problem-solving capability.",
  "hiringNotes": "Forward to engineering hiring team."
}`;

  try {
    const reportMessages = [
      { role: "system", content: "You output only valid, parseable JSON." },
      { role: "user", content: reportPrompt },
    ];

    const { reply } = await runGroqChat(reportMessages, 1000, 0.2);
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON parsed.");

    const report = JSON.parse(jsonMatch[0]);
    res.json({ report });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ error: "Failed to generate assessment report." });
  }
});

app.get("/", (req, res) => res.json({ status: "InternAdda Engine Running 🚀" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend listening on http://0.0.0.0:${PORT}`)
);
