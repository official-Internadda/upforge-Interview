import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import axios from "axios";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cashfree Production Credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "11077281f181acdf5262a38723e8277011";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "cfsk_ma_prod_07a74006fac339b18a4b690c5b9f68b9_2e31571c";
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg"; // Production Endpoint

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

// ---------------- CASHFREE PAYMENT ROUTES ---------------- //
app.post("/create-order", async (req, res) => {
  const { candidateName, candidateEmail, candidatePhone, role } = req.body;

  if (!candidateName || !candidateEmail) {
    return res.status(400).json({ error: "Candidate details required." });
  }

  const orderId = "UPFORGE_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  const payload = {
    order_id: orderId,
    order_amount: 1.0,
    order_currency: "INR",
    customer_details: {
      customer_id: "CUST_" + Date.now(),
      customer_name: candidateName.trim(),
      customer_email: candidateEmail.trim(),
      customer_phone: candidatePhone?.trim() || "9999999999",
    },
    order_meta: {
      return_url: `${req.headers.origin || "https://interview.internadda.com"}/verify-payment?order_id={order_id}`,
    },
    order_note: `AI Evaluation Fee for ${role || "Interview"}`,
  };

  try {
    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, payload, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
    });

    res.json({
      orderId,
      paymentSessionId: response.data.payment_session_id,
      amount: 29,
    });
  } catch (error) {
    console.error("Cashfree Order Create Error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to initiate payment gateway." });
  }
});

app.post("/verify-order", async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "Order ID is required" });

  try {
    const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    const isPaid = response.data.order_status === "PAID";
    res.json({ success: isPaid, orderDetails: response.data });
  } catch (error) {
    console.error("Cashfree Verify Error:", error?.response?.data || error.message);
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
    if (!req.file) return res.status(400).json({ error: "No resume PDF uploaded" });

    const text = await extractTextFromPDF(req.file.buffer);
    if (!text || text.length < 40) {
      return res.status(400).json({
        error: "Could not read text. Please ensure it is not a scanned photo PDF.",
      });
    }

    res.json({ text });
  } catch (err) {
    console.error("PDF parse error:", err);
    res.status(500).json({ error: "Failed to parse resume PDF." });
  }
});

// ---------------- TERMINAL CHAT ENGINE ---------------- //
app.post("/chat", async (req, res) => {
  const { messages, resumeText, role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required." });
  }

  const safeResume = resumeText || "General Candidate with no resume details provided.";

  const systemPrompt = `You are a Principal Tech Architect conducting a rigorous, 10-Question Technical Terminal Assessment for the role of "${role}".
Candidate Resume Context:
=== RESUME ===
${safeResume}
=== END RESUME ===

OPERATIONAL INSTRUCTIONS:
1. Conduct the assessment in a sleek CLI/Terminal persona. Output plain text directly.
2. Ask exactly 10 questions sequentially.
3. Every question must be deeply technical: test actual syntax, complex edge-cases, system bottlenecks, SQL/Python/DSA logic, or project architecture specifically listed on their resume.
4. In Question 1: Greet the candidate coldly and professionally, identify a specific technical project/claim from their resume, and challenge them with a hard technical question.
5. In Questions 2 to 9: Analyze the candidate's typed code/answer. If vague or superficial, point out the loophole and demand the exact logic/code. Never give multiple-choice hints.
6. Ask EXACTLY ONE question at a time. Maximum 2 to 3 sentences per turn.
7. Turn 10 Conclusion: When 10 questions are done, reply: "Terminal assessment concluded. Compiling technical telemetry and metrics." followed by [ASSESSMENT_COMPLETE].`;

  let chatMessages = [];
  if (!messages || messages.length === 0) {
    chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "TERMINAL_START: Candidate is connected and ready." }
    ];
  } else {
    chatMessages = [{ role: "system", content: systemPrompt }, ...messages];
    if (chatMessages[chatMessages.length - 1].role !== "user") {
      chatMessages.push({ role: "user", content: "Proceed with next evaluation prompt." });
    }
  }

  try {
    const { reply } = await runGroqChat(chatMessages, 350, 0.5);
    const isComplete = reply.includes("[ASSESSMENT_COMPLETE]");
    const cleanReply = reply.replace("[ASSESSMENT_COMPLETE]", "").trim();

    res.json({ reply: cleanReply, isComplete });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "AI Terminal timed out. Try again." });
  }
});

// ---------------- CANDIDATE REPORT ENGINE ---------------- //
app.post("/generate-report", async (req, res) => {
  const { transcript, role, candidateName } = req.body;

  if (!transcript || !role) {
    return res.status(400).json({ error: "Transcript required." });
  }

  const conversationText = transcript
    .map((m) => `${m.role === "assistant" ? "Examiner" : "Candidate"}: ${m.content}`)
    .join("\n");

  const reportPrompt = `You are a Technical Hiring Committee Lead reviewing an assessment for "${role}" candidate "${candidateName || "Applicant"}".
Transcript:
${conversationText}

Produce a strict, uninflated evaluation report strictly formatted as JSON:
{
  "overallScore": <1-10>,
  "recommendation": "<Strongly Recommend | Recommend | Review Needed | Reject>",
  "summary": "<2-3 sentence candid executive summary of code logic & depth>",
  "technicalScore": <1-10>,
  "problemSolvingScore": <1-10>,
  "codeQualityScore": <1-10>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<critical gap 1>", "<critical gap 2>"],
  "detailedFeedback": "<Detailed paragraph assessing actual technical competency>",
  "hiringNotes": "<Direct verdict for engineering manager>"
}`;

  try {
    const reportMessages = [
      { role: "system", content: "You output pure JSON only with no conversational text." },
      { role: "user", content: reportPrompt },
    ];

    const { reply } = await runGroqChat(reportMessages, 1000, 0.2);
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON generated.");

    const report = JSON.parse(jsonMatch[0]);
    res.json({ report });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ error: "Failed to generate evaluation report." });
  }
});

app.get("/", (req, res) => res.json({ status: "InternAdda AI Engine Operational ⚡" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on http://0.0.0.0:${PORT}`)
);
