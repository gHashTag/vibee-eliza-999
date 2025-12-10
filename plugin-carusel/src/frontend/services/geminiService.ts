import { GoogleGenAI, Type } from "@google/genai";
import { Language, ReferenceType } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Analyzes raw text and breaks it down into structured slides with visual prompts.
 */
export const parseStoryToSlides = async (rawText: string, language: Language): Promise<{ text: string; imagePrompt: string }[]> => {
  try {
    const langName = language === 'ru' ? 'RUSSIAN' : 'ENGLISH';
    const prompt = `
      You are an expert viral content creator for Instagram and LinkedIn in ${langName}.
      Task: Convert the provided text into a high-engagement carousel structure in ${langName}.
      
      Guidelines for Content:
      1. **Language**: Output MUST be in ${langName}.
      2. **Structure**:
         - **Slide 1 (Hook)**: Short, punchy headline.
         - **Middle Slides**: ONE distinct thought per slide. No long paragraphs.
         - **Last Slide**: Call to Action (CTA).
      3. **Formatting**: Wrap key impactful words (1-3 words per slide) in <b> tags for highlighting (e.g. "This is <b>important</b>").
      4. **Quantity**: Create 5-10 slides.
      5. **Visuals**: Provide an English image prompt for the background.
      
      Input Text:
      """
      ${rawText}
      """
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: `The content for the slide overlay in ${langName}, with <b> tags.` },
              imagePrompt: { type: Type.STRING, description: "A visual description for the background image in English." }
            },
            required: ["text", "imagePrompt"]
          }
        }
      }
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    // Sanitize markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();

    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error parsing story:", error);
    throw new Error("Failed to parse story into slides.");
  }
};

export const makeTextViral = async (currentText: string, type: 'hook' | 'body' | 'cta', language: Language): Promise<string> => {
    try {
        const langName = language === 'ru' ? 'RUSSIAN' : 'ENGLISH';
        let instruction = "";
        if (type === 'hook') {
            instruction = `Rewrite this text in ${langName} to be a viral 'Hook' headline. Use strong triggers (Fear, Curiosity, Gain). Keep it under 10 words. Wrap the main trigger word in <b> tags.`;
        } else if (type === 'cta') {
            instruction = `Rewrite this text in ${langName} to be a powerful Call to Action. Encourage saves/shares. Short. Wrap the action word in <b> tags.`;
        } else {
            instruction = `Rewrite this text in ${langName} to be clearer and punchier. One main thought. Wrap the key concept in <b> tags.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Original Text: "${currentText}"\n\nInstruction: ${instruction}\n\nOutput only the rewritten text.`,
        });

        return response.text?.trim() || currentText;
    } catch (error) {
        console.error("Error making text viral:", error);
        return currentText;
    }
};

/**
 * Upload base64 image to Replicate and get URL
 */
const uploadImageToReplicate = async (base64Data: string): Promise<string> => {
  console.log("[DEBUG] uploadImageToReplicate: Starting upload...");

  // Extract mime type and data
  const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64Only = base64Data.replace(/^data:[^;]+;base64,/, '');

  console.log("[DEBUG] uploadImageToReplicate: mimeType =", mimeType);
  console.log("[DEBUG] uploadImageToReplicate: base64 length =", base64Only.length);

  // Convert base64 to blob
  const byteCharacters = atob(base64Only);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  console.log("[DEBUG] uploadImageToReplicate: blob size =", blob.size);

  // Upload to Replicate files API via proxy
  // Replicate expects 'content' field with filename parameter
  const ext = mimeType.split('/')[1] || 'png';
  const filename = `reference.${ext}`;

  const formData = new FormData();
  formData.append('content', blob, filename);

  console.log("[DEBUG] uploadImageToReplicate: uploading as", filename);

  const uploadResponse = await fetch("/api/replicate/v1/files", {
    method: "POST",
    body: formData
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[DEBUG] uploadImageToReplicate: Upload failed:", errorText);
    throw new Error(`Failed to upload image: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log("[DEBUG] uploadImageToReplicate: Upload result:", JSON.stringify(uploadResult, null, 2));

  // Return the URL from upload response
  // Replicate returns: { urls: { get: "..." } } or direct URL
  const url = uploadResult.urls?.get || uploadResult.url || uploadResult.download_url;

  if (!url) {
    console.error("[DEBUG] uploadImageToReplicate: No URL in response!");
    throw new Error("No URL returned from file upload");
  }

  console.log("[DEBUG] uploadImageToReplicate: Final URL =", url);
  return url;
};

export const generateImage = async (prompt: string, style: string, referenceImage?: string, referenceType?: ReferenceType): Promise<string> => {
  console.log("=".repeat(50));
  console.log("[DEBUG] generateImage CALLED");
  console.log("[DEBUG] prompt:", prompt);
  console.log("[DEBUG] style:", style);
  console.log("[DEBUG] referenceImage:", referenceImage ? `[BASE64 ${referenceImage.length} chars]` : "null");
  console.log("[DEBUG] referenceType:", referenceType);
  console.log("=".repeat(50));

  try {
    // Combine user prompt with selected art style
    let fullPrompt = `${prompt}. Style: ${style}. Abstract, minimalist, high quality background wallpaper. No text.`;

    // Prepare image_input array for Nano Banana Pro
    const imageInput: string[] = [];

    if (referenceImage && referenceType) {
        console.log("[DEBUG] Reference image detected! Uploading to Replicate...");
        fullPrompt += ` IMPORTANT: Transform or incorporate the reference ${referenceType} into the generated image.`;

        try {
          const uploadedUrl = await uploadImageToReplicate(referenceImage);
          console.log("[DEBUG] Uploaded image URL:", uploadedUrl);
          imageInput.push(uploadedUrl);
        } catch (uploadError) {
          console.error("[DEBUG] Failed to upload reference image:", uploadError);
          // Continue without reference if upload fails
        }
    }

    const requestBody = {
      input: {
        prompt: fullPrompt,
        aspect_ratio: "4:5",
        resolution: "1K", // Changed from 2K to 1K for faster generation
        output_format: "png",
        safety_filter_level: "block_only_high",
        ...(imageInput.length > 0 && { image_input: imageInput })
      }
    };

    console.log("[DEBUG] Request body:", JSON.stringify(requestBody, null, 2));

    // Use Vite proxy to avoid CORS - proxy adds Authorization header
    // Using Google Nano Banana Pro (Gemini 3 image model) via Replicate
    const response = await fetch("/api/replicate/v1/models/google/nano-banana-pro/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("[DEBUG] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] Replicate error response:", errorText);
      throw new Error(`Replicate error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("[DEBUG] Replicate result:", JSON.stringify(result, null, 2));

    // Handle both sync and async responses
    let imageUrl = result.output;

    // If output is array, take first element
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0];
    }

    // If still processing, poll for result via proxy
    if (!imageUrl && result.urls?.get) {
      console.log("[DEBUG] Polling for result...");
      let attempts = 0;
      const pollPath = result.urls.get.replace('https://api.replicate.com', '/api/replicate');
      const maxAttempts = 45; // ~90 seconds max wait
      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000)); // 2 second intervals
        console.log(`[DEBUG] Poll attempt ${attempts + 1}/${maxAttempts}...`);
        const pollResponse = await fetch(pollPath);
        const pollResult = await pollResponse.json();
        console.log(`[DEBUG] Poll status: ${pollResult.status}`);

        if (pollResult.status === "succeeded") {
          imageUrl = Array.isArray(pollResult.output) ? pollResult.output[0] : pollResult.output;
          console.log("[DEBUG] Generation succeeded! URL:", imageUrl);
          break;
        } else if (pollResult.status === "failed") {
          console.error("[DEBUG] Generation failed:", pollResult.error);
          throw new Error(`Generation failed: ${pollResult.error}`);
        } else if (pollResult.status === "canceled") {
          throw new Error("Generation was canceled");
        }
        attempts++;
      }

      if (attempts >= maxAttempts && !imageUrl) {
        console.error("[DEBUG] Timeout waiting for generation");
        throw new Error("Generation timeout - model is too slow");
      }
    }

    if (!imageUrl) {
      throw new Error("No image URL in response after polling");
    }

    console.log("[DEBUG] Final image URL:", imageUrl);
    return imageUrl;

  } catch (error) {
    console.error("[DEBUG] generateImage ERROR:", error);
    throw error;
  }
};