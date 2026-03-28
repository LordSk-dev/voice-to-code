import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Transcribe this audio message. If it's a request for code, just provide the transcription of the request." },
          { inlineData: { data: base64Audio, mimeType } }
        ]
      }
    ]
  });
  return response.text;
}

export async function generateCode(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `You are a world-class software engineer. Convert the following natural language request into high-quality code. Provide ONLY the code, no explanation. Request: ${prompt}` }
        ]
      }
    ]
  });
  return response.text;
}

export async function explainCode(code: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `Explain this code snippet in a clear, concise way that is easy to understand when spoken aloud. Keep it under 100 words. Code:\n${code}` }
        ]
      }
    ]
  });
  return response.text;
}

export async function textToSpeech(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}
