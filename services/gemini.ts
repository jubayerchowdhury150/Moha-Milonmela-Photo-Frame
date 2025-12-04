import { GoogleGenAI } from "@google/genai";

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a creative caption based on the uploaded photo.
 */
export const generateCaptionForPhoto = async (base64Image: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock response.");
    return "Capture the moment!";
  }

  try {
    // Clean base64 string if it contains metadata prefix
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG/PNG, Gemini handles standard types
              data: cleanBase64
            }
          },
          {
            text: "Write a very short, catchy, heartwarming or witty caption (max 6 words) for this photo that would look good on a photo frame. Do not use quotes."
          }
        ]
      }
    });

    return response.text?.trim() || "Memories forever";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Beautiful Day";
  }
};
