// check-writing.js (if you keep this separate handler file)
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      try {
        return JSON.parse(candidate);
      } catch (e) {
        // continue searching
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  console.log("=== check-writing invoked ===");
  console.log("Method:", req.method);
  console.log("Request body:", JSON.stringify(req.body));
  console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userText, prompt: questionPrompt, rubric } = req.body || {};
  if (!userText || !userText.trim()) {
    return res.status(200).json({ passed: false, feedback: "No response was written." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const gradingPrompt = `
You must respond with valid JSON only. Do not add any text, commentary, metadata, or markdown fences.

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(gradingPrompt);
    let raw = (result.response.text() || "").trim();

    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    console.log("Gemini raw reply (check-writing.js):", raw);

    const parsed = extractFirstJsonObject(raw);
    if (!parsed) {
      console.error("Failed to extract JSON from AI response:", raw);
      return res.status(200).json({ passed: null, feedback: "Response saved. AI feedback is currently unavailable.", raw });
    }

    const passed = Boolean(parsed.meets_length && parsed.addresses_prompt && parsed.grammar_ok);
    return res.status(200).json({ passed, feedback: parsed.feedback || "Response evaluated." });
  } catch (err) {
    console.error("Gemini error name:", err && err.name);
    console.error("Gemini error message:", err && err.message);
    console.error("Gemini error stack:", err && err.stack);
    console.error("Gemini error full:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(200).json({ feedback: "AI feedback is currently unavailable.", error: err && (err.message || String(err)) });
  }
}
