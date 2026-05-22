export const GEMINI_API_KEY_PLACEHOLDER = "YOUR_GEMINI_API_KEY";

export let _geminiKey = GEMINI_API_KEY_PLACEHOLDER;

export function setGlobalGeminiKey(key) {
  _geminiKey = key;
}

export async function callGemini(prompt, key) {
  const apiKey = key || _geminiKey;
  if (!apiKey || apiKey === GEMINI_API_KEY_PLACEHOLDER) {
    return null;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}
