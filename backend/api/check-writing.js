import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  console.log("=== check-writing invoked ===");
  console.log("Method:", req.method);
  console.log("Request body:", JSON.stringify(req.body));
  console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userText } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = `Evaluate the student's German writing for grammar, vocabulary, and fluency.
Student text: "${userText}"`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();
    console.log("Gemini feedback:", feedback);
    return res.status(200).json({ feedback });
  } catch (err) {
    // Print full error details for Render logs
    console.error("Gemini error name:", err.name);
    console.error("Gemini error message:", err.message);
    console.error("Gemini error stack:", err.stack);
    console.error("Gemini error full:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    // Return the error message to the frontend temporarily for debugging
    return res.status(200).json({ feedback: "AI feedback is currently unavailable.", error: err.message || String(err) });
  }
}
