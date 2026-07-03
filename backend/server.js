import 'dotenv/config';
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Helper to create a GoogleGenerativeAI instance and check key presence
function createGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is not set.");
    return null;
  }
  return new GoogleGenerativeAI(key);
}

// Helper to pick a model (tries preferred then fallback)
function getModel(genAI, preferred = "gemini-2.5-flash", fallback = "gemini-1.5-flash") {
  try {
    return genAI.getGenerativeModel({ model: preferred });
  } catch (e) {
    console.warn(`Preferred model ${preferred} unavailable, falling back to ${fallback}`);
    return genAI.getGenerativeModel({ model: fallback });
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * Sentence equivalence check
 * Endpoint: POST /api/check-sentence
 * Body: { userSentence: string, expectedAnswer: string }
 */
app.post("/api/check-sentence", async (req, res) => {
  const { userSentence, expectedAnswer } = req.body || {};
  if (typeof userSentence !== "string" || typeof expectedAnswer !== "string") {
    return res.status(400).json({ error: "Request must include userSentence and expectedAnswer strings." });
  }

  const genAI = createGenAI();
  const prompt = `
Is the student's sentence equivalent to the expected answer?
Reply only with "correct" or "wrong".

Student: "${userSentence}"
Expected: "${expectedAnswer}"
  `;

  try {
    if (!genAI) throw new Error("Missing GEMINI_API_KEY");

    const model = getModel(genAI);
    const result = await model.generateContent(prompt);
    const text = (result.response.text() || "").toLowerCase();

    console.log("Gemini reply (sentence):", text);

    if (text.includes("correct")) {
      return res.json({ feedback: "✅ Correct!" });
    } else if (text.includes("wrong")) {
      return res.json({ feedback: "❌ Wrong." });
    } else {
      // Fallback deterministic check
      const normalized = (userSentence || "").trim().toLowerCase();
      const correct = (expectedAnswer || "").trim().toLowerCase();
      const isCorrect = normalized === correct;
      return res.json({ feedback: isCorrect ? "✅ Correct!" : "❌ Wrong." });
    }
  } catch (err) {
    console.error("Gemini error (sentence):", err && (err.message || err));
    // Deterministic fallback
    const normalized = (userSentence || "").trim().toLowerCase();
    const correct = (expectedAnswer || "").trim().toLowerCase();
    const isCorrect = normalized === correct;

    const response = { feedback: isCorrect ? "✅ Correct!" : "❌ Wrong (AI unavailable)." };
    if (process.env.DEBUG_SHOW_ERROR === "true") response.error = err && (err.message || String(err));
    return res.status(200).json(response);
  }
});

/**
 * Writing evaluation
 * Endpoint: POST /api/check-writing
 * Body: { userText: string, prompt: string, rubric: string }
 */
app.post("/api/check-writing", async (req, res) => {
  const { userText, prompt: questionPrompt, rubric } = req.body || {};

  if (!userText || !userText.trim()) {
    return res.status(200).json({
      passed: false,
      feedback: "No response was written."
    });
  }

  const gradingPrompt = `
You are a supportive German language teacher grading a student's short written response.

Question given to the student: "${questionPrompt || ""}"
Grading criteria: ${rubric || "Use general criteria: length, relevance, grammar"}

Student's response:
"""
${userText}
"""

Evaluate the response against the criteria. Be encouraging but honest about errors.
Respond with ONLY valid JSON, no markdown code fences, no extra text, in exactly this shape:
{"meets_length": true or false, "addresses_prompt": true or false, "grammar_ok": true or false, "feedback": "2-3 sentences of constructive feedback in English, written directly to the student, mentioning at least one specific strength and one specific thing to improve if applicable"}
`;

  try {
    const genAI = createGenAI();
    if (!genAI) throw new Error("Missing GEMINI_API_KEY");

    const model = getModel(genAI);
    const result = await model.generateContent(gradingPrompt);
    let raw = (result.response.text() || "").trim();

    // strip accidental markdown fences just in case
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    console.log("Gemini writing reply (raw):", raw);

    // Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON response:", parseErr);
      throw new Error("Invalid JSON from AI");
    }

    const passed = Boolean(parsed.meets_length && parsed.addresses_prompt && parsed.grammar_ok);

    return res.status(200).json({
      passed,
      feedback: parsed.feedback || "Response evaluated."
    });
  } catch (err) {
    console.error("Gemini writing-check error:", err && (err.message || err));
    const response = {
      passed: null,
      feedback: "Response saved. AI feedback is currently unavailable."
    };
    if (process.env.DEBUG_SHOW_ERROR === "true") response.error = err && (err.message || String(err));
    return res.status(200).json(response);
  }
});

// Ensure we bind to the port Render provides and to 0.0.0.0 so the port scan detects the service
const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});
