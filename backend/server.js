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

/**
 * Helpers
 */

// Remove any trailing edge_all_open_tabs or similar metadata and anything after it.
function stripEdgeTabsMetadata(text) {
  if (!text || typeof text !== "string") return text;
  const lower = text.toLowerCase();

  // Common markers that have appeared in model outputs; cut at the earliest occurrence.
  const markers = [
    "edge_all_open_tabs",
    "# user's edge",
    "# user\\'s edge",
    "the edge_all_open_tabs metadata",
    "edge_all_open_tabs =",
    "user's edge browser tabs metadata",
    "user's edge browser tabs metadata",
    "the edge_all_open_tabs metadata."
  ];

  let cutIndex = -1;
  for (const m of markers) {
    const idx = lower.indexOf(m);
    if (idx !== -1 && (cutIndex === -1 || idx < cutIndex)) cutIndex = idx;
  }

  // Also cut at any obvious header like "# User's Edge" or "The edge_all_open_tabs metadata"
  if (cutIndex === -1) {
    const headerMatch = lower.search(/#\s*user'?s\s*edge/);
    if (headerMatch !== -1) cutIndex = headerMatch;
  }

  if (cutIndex === -1) return text.trim();
  return text.slice(0, cutIndex).trim();
}

// Extract the first top-level JSON object from a string, or null.
function extractFirstJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) {
      const candidate = text.slice(start, i + 1);
      try { return JSON.parse(candidate); } catch (e) { /* continue searching */ }
    }
  }
  return null;
}

// Extract the first single word answer (useful for "correct"/"wrong").
function extractFirstWord(text) {
  if (!text || typeof text !== "string") return "";
  const cleaned = text.replace(/[`"'""«»\[\]{}<>]/g, " ").replace(/\s+/g, " ").trim();
  const first = cleaned.split(" ")[0] || "";
  return first.toLowerCase();
}

// Create GoogleGenerativeAI instance if key present
function createGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is not set.");
    return null;
  }
  return new GoogleGenerativeAI(key);
}

// Pick model with fallback
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
 * POST /api/check-sentence
 * Body: { userSentence: string, expectedAnswer: string }
 */
app.post("/api/check-sentence", async (req, res) => {
  const { userSentence, expectedAnswer } = req.body || {};
  if (typeof userSentence !== "string" || typeof expectedAnswer !== "string") {
    return res.status(400).json({ error: "Request must include userSentence and expectedAnswer strings." });
  }

  const genAI = createGenAI();
  const prompt = `
You must reply with only one word: "correct" or "wrong". Do not add any other text, explanation, or metadata.

Is the student's sentence equivalent to the expected answer?
Student: "${userSentence}"
Expected: "${expectedAnswer}"
  `;

  try {
    if (!genAI) throw new Error("Missing GEMINI_API_KEY");

    const model = getModel(genAI);
    const result = await model.generateContent(prompt);
    let raw = (result.response.text() || "").trim();

    // sanitize model output
    raw = stripEdgeTabsMetadata(raw);
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    console.log("Gemini reply (sentence) raw:", raw);

    const word = extractFirstWord(raw);
    if (word.includes("correct")) {
      return res.json({ feedback: "✅ Correct!" });
    } else if (word.includes("wrong")) {
      return res.json({ feedback: "❌ Wrong." });
    } else {
      // deterministic fallback
      const normalized = (userSentence || "").trim().toLowerCase();
      const correct = (expectedAnswer || "").trim().toLowerCase();
      const isCorrect = normalized === correct;
      return res.json({ feedback: isCorrect ? "✅ Correct!" : "❌ Wrong." });
    }
  } catch (err) {
    console.error("Gemini error (sentence):", err && (err.message || err));
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
 * POST /api/check-writing
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
You must respond with valid JSON only. Do not add any text, commentary, metadata, or markdown fences.
You must respond with exactly one JSON object and nothing else. Do not include any system, browser, or tab metadata.

You are a supportive German language teacher grading a student's short written response.

Question given to the student: "${(questionPrompt || "").replace(/\n/g, " ")}"
Grading criteria: ${(rubric || "Use general criteria: length, relevance, grammar").replace(/\n/g, " ")}

Student's response:
"""
${userText}
"""

Evaluate the response against the criteria. Be encouraging but honest about errors.
Respond with ONLY valid JSON in exactly this shape (use true/false for booleans):
{"meets_length": true or false, "addresses_prompt": true or false, "grammar_ok": true or false, "feedback": "2-3 sentences of constructive feedback in English, written directly to the student, mentioning at least one specific strength and one specific thing to improve if applicable"}
`;

  try {
    const genAI = createGenAI();
    if (!genAI) throw new Error("Missing GEMINI_API_KEY");

    const model = getModel(genAI);
    const result = await model.generateContent(gradingPrompt);
    let raw = (result.response.text() || "").trim();

    // sanitize model output
    raw = stripEdgeTabsMetadata(raw);
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    console.log("AI raw output (writing):", raw);

    const parsed = extractFirstJsonObject(raw);
    if (!parsed) {
      console.error("Failed to extract JSON from AI response. Raw:", raw);
      throw new Error("Invalid JSON from AI");
    }

    // Clean the feedback field in case the model put metadata inside the string
    let cleanedFeedback = (parsed.feedback || "").toString().trim();
    cleanedFeedback = stripEdgeTabsMetadata(cleanedFeedback);
    cleanedFeedback = cleanedFeedback.replace(/\s+$/g, "").trim();

    // Compute passed strictly (ensure booleans are true)
    const passed = Boolean(parsed.meets_length === true && parsed.addresses_prompt === true && parsed.grammar_ok === true);

    return res.status(200).json({
      passed,
      feedback: cleanedFeedback || "Response evaluated."
    });
  } catch (err) {
    console.error("Gemini writing-check error:", err && (err.message || err));
    const response = {
      passed: null,
      feedback: "Response saved. AI feedback is currently unavailable."
    };
    if (process.env.DEBUG_SHOW_ERROR === "true") {
      response.error = err && (err.message || String(err));
    }
    return res.status(200).json(response);
  }
});

// Bind to Render-provided port and 0.0.0.0
const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});
