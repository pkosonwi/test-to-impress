import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseBase64 = (base64WithPrefix: string) => {
    const parts = base64WithPrefix.split(';base64,');
    if (parts.length === 2) {
        const mimeType = parts[0].split(':')[1];
        const data = parts[1];
        return { mimeType, data };
    }
    
    const commaParts = base64WithPrefix.split(',');
    if (commaParts.length === 2) {
        const mimeType = commaParts[0].split(':')[1].split(';')[0];
        return { mimeType, data: commaParts[1] };
    }

    throw new Error("Invalid base64 string format");
};

export const generateOutfitOnModel = async (compositeImageBase64: string): Promise<string> => {
    try {
        const compositeImagePart = {
            inlineData: parseBase64(compositeImageBase64),
        };

        const textPromptPart = {
            text: `You are a world-class AI photo editor specializing in hyper-realistic virtual try-on technology.

**Primary Goal:** Your mission is to transform a composite image into a single, photorealistic image where the clothing appears to be naturally worn by the model.

**Input Image Analysis:**
- The provided image is a composite. It consists of a base photograph of a model.
- On top of this base, one or more clothing items have been placed as separate layers. These clothing items have transparent backgrounds.

**Your Task - Step-by-step Instructions:**
1.  **Seamless Integration:** Your primary task is to seamlessly integrate **EVERY SINGLE** overlaid clothing item onto the model. The clothes must look like they are actually being worn, draping naturally over the model's body according to the pose and posture, while respecting the item's original style.
2.  **Preserve Original Shape and Style:** This is critical. You MUST maintain the original silhouette, fit, and proportions of each clothing item as it appears in the overlay. For example, if a shirt is oversized, it must be rendered as oversized on the model, not as a tight-fitting shirt. If an item is cropped, it should remain cropped. Do not alter the fundamental shape of the clothing.
3.  **Eliminate Artifacts:** The clothing items are overlays. You MUST completely ignore and eliminate any faint square outlines, bounding boxes, or digital artifacts from these overlays. The final image must have NO GHOSTING or boxy shapes around the clothes.
4.  **Inject Realism:** Create natural fabric behavior. This includes adding realistic wrinkles, folds, shadows, and highlights. The lighting on the clothes must perfectly match the ambient lighting of the original background and model.
5.  **Preserve Integrity:** The model's physical appearance (face, body shape, skin tone, hair) and the entire background environment are NON-NEGOTIABLE. They must remain completely unchanged.

**ABSOLUTE RULES - NON-COMPLIANCE IS FAILURE:**
-   **DO NOT** alter the model or background in any way.
-   **DO NOT** change the original shape, fit (e.g., oversized, cropped), or style of the clothing items.
-   **DO NOT** add, remove, substitute, or ignore any of the clothing items provided in the image. ALL items must be rendered on the model.
-   **DO NOT** output an image with visible seams, pixelation, or any trace of the original clothing item's square boundaries.
-   The final output **MUST** be a high-quality photograph with the same aspect ratio as the input.`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    compositeImagePart,
                    textPromptPart,
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Find the image part in the response
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const newBase64Data = part.inlineData.data;
                const newMimeType = part.inlineData.mimeType;
                return `data:${newMimeType};base64,${newBase64Data}`;
            }
        }
        throw new Error("API did not return an image.");

    } catch (error) {
        console.error("Error generating outfit with Gemini API:", error);
        throw new Error("Failed to generate the new outfit. Please try again.");
    }
};