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
