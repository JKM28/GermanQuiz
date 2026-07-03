import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userSentence, expectedAnswer } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const prompt = `
  Is the student's sentence equivalent to the expected answer?
  Reply only with "correct" or "wrong".

  Student: "${userSentence}"
  Expected: "${expectedAnswer}"
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().toLowerCase();

    if (text.includes("correct")) {
      return res.json({ feedback: "✅ Correct!" });
    } else if (text.includes("wrong")) {
      return res.json({ feedback: "❌ Wrong." });
    } else {
      // Fallback: direct string comparison
      const normalized = (userSentence || "").trim().toLowerCase();
      const correct = (expectedAnswer || "").trim().toLowerCase();
      return res.json({
        feedback: normalized === correct ? "✅ Correct!" : "❌ Wrong."
      });
    }
  } catch (err) {
    console.error("Gemini error:", err);
    // Fallback if Gemini API fails
    const normalized = (userSentence || "").trim().toLowerCase();
    const correct = (expectedAnswer || "").trim().toLowerCase();
    return res.json({
      feedback: normalized === correct ? "✅ Correct!" : "❌ Wrong (AI unavailable)."
    });
  }
}
