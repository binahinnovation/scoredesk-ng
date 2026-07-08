// AI Utility - Uses Gemini API with fallback to Mistral API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

export async function generateWithMistral(prompt: string): Promise<string> {
  if (!MISTRAL_API_KEY) {
    throw new Error("Mistral API key is not configured. Please set VITE_MISTRAL_API_KEY in your .env file.");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: "mistral-small-latest", // Default fallback model
      messages: [{ role: "user", content: prompt }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Mistral AI generation failed.");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No content generated.";
}

export async function generateWithAI(prompt: string): Promise<string> {
  // Attempt Gemini first
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is missing");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Gemini API request failed.");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";
  } catch (error) {
    console.warn("Gemini generation failed, falling back to Mistral API:", error);
    // Fallback to Mistral
    return generateWithMistral(prompt);
  }
}
