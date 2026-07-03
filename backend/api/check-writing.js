import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userText } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = `Evaluate the student's German writing for grammar, vocabulary, and fluency. 
  Give short feedback (1–2 sentences). Student text: "${userText}"`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();
    return res.json({ feedback });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.json({ feedback: "AI feedback unavailable." });
  }
}
